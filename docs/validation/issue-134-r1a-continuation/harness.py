#!/usr/bin/env python3
"""Prepared-only retained-cohort continuation for HV134. Default: refuse."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import ssl
import sys
import threading
import time
import urllib.error
import urllib.request
import uuid
from concurrent.futures import Future, ThreadPoolExecutor, wait
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable, Mapping

import sql_contract

ROOT = Path(__file__).resolve().parent
MANIFEST_PATH = ROOT / "manifest.json"
PROTOCOL = "hv134-c01-v1"
FIXED_CONTINUATION_ID = "HV134-20261006-C01"
MAX_RESPONSE_BYTES = 4_000_000
UUID_RE = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$")


class Stop(RuntimeError):
    """Fail-closed stop with no automatic retry."""


class RequestFailure(Stop):
    def __init__(self, reason: str, *, http_status: int | None = None, timed_out: bool = False):
        super().__init__(reason)
        self.http_status = http_status
        self.timed_out = timed_out


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def canonical_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_manifest() -> dict[str, Any]:
    value = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    if value.get("continuation_id") != FIXED_CONTINUATION_ID:
        raise Stop("fixed continuation identity drift")
    validate_arithmetic(value)
    return value


def package_identity(manifest: dict[str, Any]) -> tuple[str, dict[str, str]]:
    members: dict[str, str] = {}
    aggregate = hashlib.sha256()
    for name in sorted(manifest["package_members"]):
        path = ROOT / name
        digest = sha256_file(path)
        members[name] = digest
        aggregate.update(name.encode("utf-8"))
        aggregate.update(b"\0")
        aggregate.update(digest.encode("ascii"))
        aggregate.update(b"\n")
    return aggregate.hexdigest(), members


def verify_immutable_local_sources(manifest: dict[str, Any]) -> None:
    drift: dict[str, Any] = {}
    for relative, expected in manifest["immutable_local_sources"].items():
        path = (ROOT / relative).resolve()
        observed = sha256_file(path) if path.is_file() else None
        if observed != expected:
            drift[relative] = {"expected": expected, "observed": observed}
    if drift:
        raise Stop("immutable source/evidence drift: " + canonical_json(drift))


def validate_arithmetic(manifest: dict[str, Any]) -> None:
    initial = manifest["known_initial"]
    final = manifest["expected_final"]
    if initial["public_rows"] != initial["parent_public_rows"] + initial["financial_public_rows"]:
        raise Stop("initial row arithmetic drift")
    if final["public_rows"] != final["parent_public_rows"] + final["financial_public_rows"]:
        raise Stop("final row arithmetic drift")
    expected = {
        "attempts": initial["attempts"] + 2,
        "events": initial["events"] + 3,
        "linked_ledgers": initial["linked_ledgers"] + 1,
        "ledger_total_cents": initial["ledger_total_cents"] + 100,
        "obligations": initial["obligations"] + 4,
        "pending_obligations": initial["pending_obligations"] + 3,
        "not_required_obligations": initial["not_required_obligations"] + 1,
        "sequence_last_value": str(int(initial["sequence_last_value"]) + 3),
    }
    drift = {key: [value, final.get(key)] for key, value in expected.items() if final.get(key) != value}
    if drift or final["financial_public_rows"] != initial["financial_public_rows"] + 10:
        raise Stop("planned continuation arithmetic drift: " + canonical_json(drift))


class EvidenceSink:
    def record(self, value: dict[str, Any]) -> None:
        raise NotImplementedError


class FileEvidence(EvidenceSink):
    def __init__(self, package_hash: str, members: dict[str, str]):
        parent = ROOT / "evidence"
        parent.mkdir(mode=0o700, exist_ok=True)
        self.directory = parent / FIXED_CONTINUATION_ID
        self.directory.mkdir(mode=0o700, exist_ok=False)
        self.path = self.directory / "evidence.jsonl"
        self._lock = threading.Lock()
        self.record(
            {
                "event_key": "package-start",
                "observed_at": utc_now(),
                "continuation_id": FIXED_CONTINUATION_ID,
                "package_hash": package_hash,
                "members": members,
                "status": "STARTED_NOT_ACCEPTED",
            }
        )

    def record(self, value: dict[str, Any]) -> None:
        data = (canonical_json(value) + "\n").encode("utf-8")
        with self._lock:
            fd = os.open(self.path, os.O_WRONLY | os.O_CREAT | os.O_APPEND, 0o600)
            try:
                os.write(fd, data)
                os.fsync(fd)
            finally:
                os.close(fd)


class MemoryEvidence(EvidenceSink):
    def __init__(self) -> None:
        self.rows: list[dict[str, Any]] = []
        self._lock = threading.Lock()

    def record(self, value: dict[str, Any]) -> None:
        with self._lock:
            self.rows.append(value)


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(
        self, req: Any, fp: Any, code: int, msg: str, headers: Any, newurl: str
    ) -> None:
        return None


def fixed_https_opener() -> urllib.request.OpenerDirector:
    return urllib.request.build_opener(
        urllib.request.ProxyHandler({}),
        urllib.request.HTTPSHandler(context=ssl.create_default_context()),
        NoRedirect(),
    )


@dataclass(frozen=True)
class HttpResult:
    status: int
    payload: dict[str, Any]


class ManagementSQL:
    def __init__(self, token: str, manifest: dict[str, Any]):
        self.token = token
        self.manifest = manifest
        self.url = manifest["project"]["management_query_url"]
        self.allowlist = frozenset(manifest["execution_allowlist"])

    def query(self, label: str, sql: str, *, read_only: bool, timeout: int) -> HttpResult:
        if label not in self.allowlist:
            raise RequestFailure("request label is outside the literal allowlist")
        if any(token in sql.lower() for token in (" grant ", " revoke ", " create table ", " alter table ")):
            raise RequestFailure("DDL or privilege mutation is forbidden")
        body = canonical_json({"query": sql, "read_only": read_only}).encode("utf-8")
        request = urllib.request.Request(
            self.url,
            data=body,
            method="POST",
            headers={
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json",
                "Accept": "application/json",
                "User-Agent": "chasum-hv134-c01-prepared/1",
            },
        )
        try:
            with fixed_https_opener().open(request, timeout=timeout) as response:
                status = response.status
                if status not in (200, 201):
                    raise RequestFailure("Management SQL returned an unaccepted status", http_status=status)
                raw = response.read(MAX_RESPONSE_BYTES + 1)
            if len(raw) > MAX_RESPONSE_BYTES:
                raise RequestFailure("Management SQL response exceeded the size bound", http_status=status)
            decoded = json.loads(raw.decode("utf-8"))
        except urllib.error.HTTPError as exc:
            raise RequestFailure(
                "Management SQL HTTP failure", http_status=exc.code, timed_out=False
            ) from exc
        except (TimeoutError, urllib.error.URLError) as exc:
            raise RequestFailure("Management SQL unavailable or timed out", timed_out=True) from exc
        except (UnicodeDecodeError, json.JSONDecodeError) as exc:
            raise RequestFailure("Management SQL returned malformed JSON", http_status=status) from exc
        if not isinstance(decoded, list) or not all(isinstance(row, dict) for row in decoded):
            raise RequestFailure("Management SQL response shape drift", http_status=status)
        envelopes: list[dict[str, Any]] = []
        for row in decoded:
            if len(row) != 1:
                continue
            value = next(iter(row.values()))
            if isinstance(value, str):
                try:
                    value = json.loads(value)
                except json.JSONDecodeError:
                    continue
            if isinstance(value, dict) and value.get("protocol") == PROTOCOL:
                envelopes.append(value)
        if len(envelopes) != 1:
            raise RequestFailure("expected exactly one protocol envelope", http_status=status)
        return HttpResult(status=status, payload=envelopes[0])


def recorded_request(
    evidence: EvidenceSink,
    label: str,
    call: Callable[[], HttpResult],
    *,
    transactional: bool,
) -> dict[str, Any]:
    started_at = utc_now()
    started = time.monotonic()
    evidence.record(
        {
            "event_key": "request-start",
            "request_label": label,
            "observed_at": started_at,
            "continuation_id": FIXED_CONTINUATION_ID,
        }
    )
    try:
        response = call()
        payload = response.payload
        record = {
            "ok": True,
            "request_label": label,
            "http_status": response.status,
            "backend_identity": payload.get("backend_identity"),
            "result": payload.get("result"),
            "witness": payload.get("witness"),
            "payload": payload,
            "commit_ack": payload.get("commit_ack") is True if transactional else None,
            "outcome_unknown": False,
        }
    except RequestFailure as exc:
        record = {
            "ok": False,
            "request_label": label,
            "http_status": exc.http_status,
            "backend_identity": None,
            "result": None,
            "witness": None,
            "commit_ack": "UNKNOWN" if transactional else None,
            "outcome_unknown": transactional,
            "timeout": exc.timed_out,
            "error": str(exc),
        }
    except Exception:
        record = {
            "ok": False,
            "request_label": label,
            "http_status": None,
            "backend_identity": None,
            "result": None,
            "witness": None,
            "commit_ack": "UNKNOWN" if transactional else None,
            "outcome_unknown": transactional,
            "timeout": False,
            "error": "unexpected local request failure",
        }
    record["started_at"] = started_at
    record["finished_at"] = utc_now()
    record["duration_ms"] = round((time.monotonic() - started) * 1000, 3)
    evidence.record({"event_key": "request-finish", **record})
    return record


def require_uuid(value: Any, label: str) -> str:
    text = str(value).lower()
    if not UUID_RE.fullmatch(text):
        raise Stop(f"{label} is missing or malformed")
    return text


def assert_snapshot_preserved(
    before: Mapping[str, Any], after: Mapping[str, Any], label: str
) -> None:
    if dict(before) != dict(after):
        raise Stop(f"{label} snapshot/digest drift")


def assert_preflight(manifest: dict[str, Any], payload: dict[str, Any]) -> dict[str, Any]:
    required_true = (
        "transaction_read_only",
        "server17",
        "observer_exact",
        "observer_capable",
        "writer_set_capable",
        "foundation_identity",
        "r1a_identity",
        "admit_body_identity",
        "commit_body_identity",
        "function_acl",
        "rls_enabled",
        "writer_acl",
        "exact_auth",
        "retained_attempts_exact",
        "retained_tuples_exact",
        "retained_ledgers_exact",
        "retained_event_obligation_exact",
        "global_financial_counts_exact",
        "parent_scope_total_exact",
        "c1_n1_absent",
        "r1_unchanged",
        "no_active_scope_sessions",
        "cohort_jobs_send_intents_zero",
    )
    failed = [key for key in required_true if payload.get(key) is not True]
    expected_parent = {
        "businesses": 2,
        "business_hours": 14,
        "locations": 2,
        "location_settings": 2,
        "location_hours": 14,
        "identity_decisions": 2,
        "customers": 3,
        "services": 1,
        "staff": 1,
        "staff_hours": 7,
        "service_locations": 1,
        "staff_locations": 1,
        "staff_services": 1,
        "appointments": 2,
    }
    if payload.get("exact_parent_counts") != expected_parent:
        failed.append("exact_parent_counts")
    sequence = payload.get("sequence")
    if sequence != {
        "last_value": "11",
        "is_called": True,
        "increment": "1",
        "cache": "1",
        "cycle": False,
    }:
        failed.append("sequence")
    if payload.get("noncohort_snapshot") != manifest["noncohort_baselines"]:
        failed.append("noncohort_snapshot")
    snapshot = payload.get("cohort_snapshot")
    expected_snapshot_counts = {
        "businesses": 2,
        "business_hours": 14,
        "locations": 2,
        "location_settings": 2,
        "location_hours": 14,
        "identity_decisions": 2,
        "customers": 3,
        "services": 1,
        "staff": 1,
        "staff_working_hours": 7,
        "service_locations": 1,
        "staff_locations": 1,
        "staff_services": 1,
        "appointments": 2,
        "attempts": 4,
        "events": 8,
        "ledgers": 3,
        "obligations": 12,
    }
    if not isinstance(snapshot, dict) or any(
        not isinstance(snapshot.get(key), list)
        or snapshot[key][0] != str(count)
        or not isinstance(snapshot[key][1], str)
        for key, count in expected_snapshot_counts.items()
    ):
        failed.append("cohort_snapshot")
    if failed:
        raise Stop("preflight failed before mutation: " + ",".join(sorted(set(failed))))
    return snapshot


def positive_observer_probe(
    db: ManagementSQL, evidence: EvidenceSink, nonce: str | None = None
) -> None:
    nonce = nonce or uuid.uuid4().hex[:8]
    with ThreadPoolExecutor(max_workers=2, thread_name_prefix="hv134-c01-observer") as pool:
        holder = pool.submit(
            recorded_request,
            evidence,
            "observer-visibility-holder",
            lambda: db.query(
                "observer-visibility-holder",
                sql_contract.observer_probe_sql("holder", nonce),
                read_only=False,
                timeout=15,
            ),
            transactional=True,
        )
        deadline = time.monotonic() + 3
        ready = False
        holder_pid: int | None = None
        while time.monotonic() < deadline:
            probe = recorded_request(
                evidence,
                "observer-visibility-read",
                lambda: db.query(
                    "observer-visibility-read",
                    sql_contract.activity_ready_sql("hv134_c01_vh_" + nonce),
                    read_only=False,
                    timeout=5,
                ),
                transactional=False,
            )
            if probe["ok"] and probe["payload"].get("ready") is True:
                observed_pid = probe["payload"].get("backend_pid")
                if isinstance(observed_pid, int) and observed_pid > 0:
                    ready = True
                    holder_pid = observed_pid
                    break
            time.sleep(0.1)
        if not ready or holder_pid is None:
            holder.result()
            raise Stop("observer visibility holder was not ready; no payment dispatch")
        waiter = pool.submit(
            recorded_request,
            evidence,
            "observer-visibility-waiter",
            lambda: db.query(
                "observer-visibility-waiter",
                sql_contract.observer_probe_sql("waiter", nonce),
                read_only=False,
                timeout=15,
            ),
            transactional=True,
        )
        visible = False
        deadline = time.monotonic() + 4
        while time.monotonic() < deadline:
            probe = recorded_request(
                evidence,
                "observer-visibility-read",
                lambda: db.query(
                    "observer-visibility-read",
                    sql_contract.observer_probe_sql("read", nonce, holder_pid),
                    read_only=False,
                    timeout=5,
                ),
                transactional=False,
            )
            if probe["ok"] and probe["payload"].get("visible") is True:
                visible = True
                evidence.record(
                    {
                        "event_key": "observer-visibility-witness",
                        "classification": "MATCH",
                        "observed": probe["payload"].get("observed"),
                    }
                )
                break
            time.sleep(0.1)
        done, pending = wait((holder, waiter), timeout=16)
        if pending:
            raise Stop("observer probe completion bound expired; no payment dispatch")
        holder_record, waiter_record = holder.result(), waiter.result()
        holder_backend = (holder_record.get("payload") or {}).get("backend_identity") or {}
        waiter_backend = (waiter_record.get("payload") or {}).get("backend_identity") or {}
        if (
            not visible
            or not holder_record["ok"]
            or not waiter_record["ok"]
            or holder_backend.get("pid") != holder_pid
            or holder_backend.get("session_user") != db.manifest["project"]["observer_role"]
            or holder_backend.get("effective_role") != db.manifest["project"]["observer_role"]
            or waiter_backend.get("session_user") != db.manifest["project"]["observer_role"]
            or waiter_backend.get("effective_role") != db.manifest["project"]["observer_role"]
            or waiter_backend.get("writer_role") != db.manifest["project"]["writer_role"]
        ):
            raise Stop("actual observer wait-field visibility not proven; no payment dispatch")


def validate_admission(record: dict[str, Any], label: str) -> str:
    if not record["ok"] or record.get("commit_ack") is not True:
        raise Stop(f"{label} admission acknowledgment is absent or unknown")
    result = record.get("result")
    if not isinstance(result, dict) or result.get("outcome") != "ADMITTED":
        raise Stop(f"{label} admission result is missing or malformed")
    backend = record.get("backend_identity")
    if (
        not isinstance(backend, dict)
        or not isinstance(backend.get("pid"), int)
        or backend.get("session_user") != "postgres"
        or backend.get("effective_role") != "postgres"
        or backend.get("writer_role") != "service_role"
    ):
        raise Stop(f"{label} writer/backend identity mismatch")
    if result.get("execution_state") != "REQUESTED" or result.get("conflict_event_id") is not None:
        raise Stop(f"{label} admission identity/state mismatch")
    return require_uuid(result.get("attempt_id"), f"{label} attempt")


def witness_matches(
    holder: dict[str, Any], workers: list[dict[str, Any]], manifest: dict[str, Any]
) -> bool:
    witness = holder.get("witness")
    holder_backend = holder.get("backend_identity")
    worker_backends = [worker.get("backend_identity") for worker in workers]
    if (
        not holder.get("ok")
        or holder.get("commit_ack") is not True
        or not isinstance(witness, dict)
        or not isinstance(holder_backend, dict)
        or not all(isinstance(value, dict) for value in worker_backends)
    ):
        return False
    holder_pid = holder_backend.get("pid")
    witness_workers = witness.get("workers")
    chain = witness.get("blocker_chain")
    if (
        not isinstance(holder_pid, int)
        or witness.get("holder_pid") != holder_pid
        or not isinstance(witness_workers, list)
        or len(witness_workers) != 2
        or not isinstance(chain, list)
    ):
        return False
    observed_pids = {row.get("pid") for row in witness_workers if isinstance(row, dict)}
    returned_pids = {row.get("pid") for row in worker_backends if isinstance(row, dict)}
    observer_role = manifest["project"]["observer_role"]
    writer_role = manifest["project"]["writer_role"]
    if (
        observed_pids != returned_pids
        or len(observed_pids) != 2
        or any(
            row.get("state") != "active"
            or row.get("wait_event_type") != "Lock"
            or not row.get("wait_event")
            for row in witness_workers
        )
        or any(
            row.get("session_user") != observer_role
            or row.get("effective_role") != observer_role
            or row.get("writer_role") != writer_role
            for row in worker_backends
        )
    ):
        return False
    roots_reaching_holder = {
        row.get("worker_pid")
        for row in chain
        if isinstance(row, dict)
        and isinstance(row.get("path"), list)
        and holder_pid in row["path"]
    }
    return roots_reaching_holder == observed_pids


def assert_after_c1_admit(
    manifest: dict[str, Any],
    payload: dict[str, Any],
    attempt_id: str,
    before_snapshot: Mapping[str, Any],
) -> None:
    assert_snapshot_preserved(before_snapshot, payload.get("cohort_snapshot", {}), "preexisting cohort")
    if payload.get("noncohort_snapshot") != manifest["noncohort_baselines"]:
        raise Stop("noncohort baseline drift after C1 admission")
    expected_counts = {
        "attempts": 5,
        "accepted_attempts": 3,
        "requested_attempts": 2,
        "events": 9,
        "requested_events": 5,
        "accepted_events": 3,
        "conflict_events": 1,
        "linked_ledgers": 3,
        "ledger_total_cents": 18000,
        "obligations": 12,
        "pending_obligations": 12,
        "not_required_obligations": 0,
    }
    c1 = payload.get("c1")
    if (
        payload.get("counts") != expected_counts
        or not isinstance(c1, dict)
        or c1.get("attempt_id") != attempt_id
        or c1.get("execution_state") != "REQUESTED"
        or c1.get("ledger_id") is not None
        or c1.get("ledger_count") != 0
        or c1.get("event_count") != 1
        or c1.get("obligation_count") != 0
        or c1.get("pending_count") != 0
        or c1.get("not_required_appointment_cache") is not False
        or payload.get("sequence") != {"last_value": "12", "is_called": True}
        or payload.get("n1_state") is not None
        or payload.get("n1")
        != {"attempt_count": 0, "event_count": 0, "ledger_count": 0, "obligation_count": 0}
        or payload.get("r1_state") != "REQUESTED"
        or payload.get("global_counts")
        != {"attempts": 5, "events": 9, "linked_ledgers": 3, "obligations": 12}
        or payload.get("auth_users") != 2
        or payload.get("auth_identities") != 2
        or payload.get("cohort_jobs") != 0
        or payload.get("cohort_send_intents") != 0
    ):
        raise Stop("C1 admission durable reconciliation mismatch")


def run_c1_concurrency(
    db: ManagementSQL,
    evidence: EvidenceSink,
    manifest: dict[str, Any],
    attempt_id: str,
    before_snapshot: Mapping[str, Any],
    nonce: str | None = None,
) -> dict[str, Any]:
    nonce = nonce or uuid.uuid4().hex[:8]
    records: dict[str, dict[str, Any]] = {}
    futures: dict[str, Future[dict[str, Any]]] = {}
    with ThreadPoolExecutor(max_workers=3, thread_name_prefix="hv134-c01") as pool:
        futures["c1-holder"] = pool.submit(
            recorded_request,
            evidence,
            "c1-holder",
            lambda: db.query(
                "c1-holder",
                sql_contract.holder_sql(manifest, attempt_id, nonce),
                read_only=False,
                timeout=30,
            ),
            transactional=True,
        )
        deadline = time.monotonic() + 4
        ready = False
        while time.monotonic() < deadline:
            observation = recorded_request(
                evidence,
                "c1-holder-ready",
                lambda: db.query(
                    "c1-holder-ready",
                    sql_contract.activity_ready_sql("hv134_c01_hr_" + nonce),
                    read_only=False,
                    timeout=5,
                ),
                transactional=False,
            )
            if observation["ok"] and observation["payload"].get("ready") is True:
                ready = True
                break
            time.sleep(0.1)
        if not ready:
            records["c1-holder"] = futures["c1-holder"].result()
            recorded_request(
                evidence,
                "c1-durable-reconcile",
                lambda: db.query(
                    "c1-durable-reconcile",
                    sql_contract.reconcile_sql(manifest, "holder-not-ready", attempt_id),
                    read_only=False,
                    timeout=30,
                ),
                transactional=False,
            )
            raise Stop("C1 holder readiness not proven; no worker dispatched")
        for index in (1, 2):
            label = f"c1-worker-{index}"
            futures[label] = pool.submit(
                recorded_request,
                evidence,
                label,
                lambda index=index, label=label: db.query(
                    label,
                    sql_contract.worker_sql(manifest, attempt_id, nonce, index),
                    read_only=False,
                    timeout=30,
                ),
                transactional=True,
            )
        done, pending = wait(tuple(futures.values()), timeout=34)
        completion_uncertain = bool(pending)
        if pending:
            evidence.record(
                {
                    "event_key": "dispatch-uncertainty",
                    "classification": "STOP_PRESERVE_AWAIT_BOUNDED_COMPLETION",
                    "pending_labels": sorted(label for label, future in futures.items() if future in pending),
                }
            )
        for label, future in futures.items():
            records[label] = future.result()

    durable = recorded_request(
        evidence,
        "c1-durable-reconcile",
        lambda: db.query(
            "c1-durable-reconcile",
            sql_contract.reconcile_sql(manifest, "after-c1", attempt_id),
            read_only=False,
            timeout=30,
        ),
        transactional=False,
    )
    if durable["ok"]:
        assert_snapshot_preserved(
            before_snapshot, durable["payload"].get("cohort_snapshot", {}), "preexisting cohort"
        )
        if durable["payload"].get("noncohort_snapshot") != manifest["noncohort_baselines"]:
            raise Stop("noncohort baseline drift after C1 dispatch")

    holder = records["c1-holder"]
    workers = [records["c1-worker-1"], records["c1-worker-2"]]
    witness_ok = witness_matches(holder, workers, manifest)
    evidence.record(
        {
            "event_key": "concurrency-witness-assertion",
            "classification": "MATCH" if witness_ok else "STOP",
            "witness": holder.get("witness"),
        }
    )
    results = [record.get("result") for record in workers]
    reply_ok = (
        all(record["ok"] and record.get("commit_ack") is True for record in workers)
        and all(isinstance(result, dict) for result in results)
        and sorted(result.get("outcome") for result in results) == ["RECORDED", "REPLAY"]
        and all(result.get("attempt_id") == attempt_id for result in results)
        and results[0].get("transaction_id") == results[1].get("transaction_id")
        and UUID_RE.fullmatch(str(results[0].get("transaction_id", "")).lower()) is not None
    )
    evidence.record(
        {
            "event_key": "concurrency-reply-pair-assertion",
            "classification": "MATCH" if reply_ok else "STOP",
            "outcomes": results,
        }
    )
    counts = durable.get("payload", {}).get("counts")
    c1 = durable.get("payload", {}).get("c1")
    durable_ledger_id = c1.get("ledger_id") if isinstance(c1, dict) else None
    durable_ok = (
        durable["ok"]
        and isinstance(counts, dict)
        and isinstance(c1, dict)
        and c1.get("attempt_id") == attempt_id
        and c1.get("execution_state") == "ACCEPTED"
        and UUID_RE.fullmatch(str(durable_ledger_id or "").lower()) is not None
    )
    durable_ok = bool(
        durable_ok
        and c1.get("ledger_count") == 1
        and c1.get("event_count") == 2
        and c1.get("obligation_count") == 4
        and c1.get("pending_count") == 3
        and c1.get("not_required_appointment_cache") is True
        and counts
        == {
            "attempts": 5,
            "accepted_attempts": 4,
            "requested_attempts": 1,
            "events": 10,
            "requested_events": 5,
            "accepted_events": 4,
            "conflict_events": 1,
            "linked_ledgers": 4,
            "ledger_total_cents": 18100,
            "obligations": 16,
            "pending_obligations": 15,
            "not_required_obligations": 1,
        }
        and durable["payload"].get("sequence") == {"last_value": "13", "is_called": True}
        and durable["payload"].get("n1_state") is None
        and durable["payload"].get("n1")
        == {"attempt_count": 0, "event_count": 0, "ledger_count": 0, "obligation_count": 0}
        and durable["payload"].get("r1_state") == "REQUESTED"
        and durable["payload"].get("global_counts")
        == {"attempts": 5, "events": 10, "linked_ledgers": 4, "obligations": 16}
        and durable["payload"].get("auth_users") == 2
        and durable["payload"].get("auth_identities") == 2
        and durable["payload"].get("cohort_jobs") == 0
        and durable["payload"].get("cohort_send_intents") == 0
    )
    evidence.record(
        {
            "event_key": "c1-durable-ledger-assertion",
            "classification": "MATCH" if durable_ok else "STOP",
            "observed": {"counts": counts, "c1": c1},
        }
    )
    reply_durable_match = bool(
        reply_ok
        and durable_ok
        and results[0].get("transaction_id") == durable_ledger_id
        and results[1].get("transaction_id") == durable_ledger_id
    )
    evidence.record(
        {
            "event_key": "reply-durable-identity-crosscheck",
            "classification": "MATCH" if reply_durable_match else "STOP",
            "durable_ledger_id": durable_ledger_id,
        }
    )
    if (
        completion_uncertain
        or not witness_ok
        or not reply_ok
        or not durable_ok
        or not reply_durable_match
    ):
        raise Stop("C1 concurrency is partial/uncertain; preserve all request records and stop before N1")
    return durable["payload"]


def assert_final(
    manifest: dict[str, Any], payload: dict[str, Any], before_snapshot: Mapping[str, Any]
) -> None:
    assert_snapshot_preserved(before_snapshot, payload.get("cohort_snapshot", {}), "preexisting cohort")
    if payload.get("noncohort_snapshot") != manifest["noncohort_baselines"]:
        raise Stop("noncohort baseline drift in final reconciliation")
    expected = dict(manifest["expected_final"])
    counts = payload.get("counts", {})
    count_expected = {
        key: expected[key]
        for key in (
            "attempts",
            "accepted_attempts",
            "requested_attempts",
            "events",
            "requested_events",
            "accepted_events",
            "conflict_events",
            "linked_ledgers",
            "ledger_total_cents",
            "obligations",
            "pending_obligations",
            "not_required_obligations",
        )
    }
    if counts != count_expected:
        raise Stop("final count arithmetic mismatch")
    if payload.get("sequence") != {"last_value": "14", "is_called": True}:
        raise Stop("final sequence mismatch")
    if payload.get("n1_state") != "REQUESTED" or payload.get("r1_state") != "REQUESTED":
        raise Stop("N1/R1 final state mismatch")
    if payload.get("n1") != {
        "attempt_count": 1,
        "event_count": 1,
        "ledger_count": 0,
        "obligation_count": 0,
    }:
        raise Stop("N1 request-only durable shape mismatch")
    if payload.get("global_counts") != {
        "attempts": 6,
        "events": 11,
        "linked_ledgers": 4,
        "obligations": 16,
    }:
        raise Stop("final global financial count mismatch")
    if (
        payload.get("auth_users") != 2
        or payload.get("auth_identities") != 2
        or payload.get("cohort_jobs") != 0
        or payload.get("cohort_send_intents") != 0
    ):
        raise Stop("final Auth/containment mismatch")


def execute(
    manifest: dict[str, Any],
    db: ManagementSQL,
    evidence: EvidenceSink,
) -> None:
    preflight = recorded_request(
        evidence,
        "preflight",
        lambda: db.query(
            "preflight", sql_contract.preflight_sql(manifest), read_only=False, timeout=35
        ),
        transactional=False,
    )
    if not preflight["ok"]:
        raise Stop("database preflight unavailable; zero continuation writes")
    before_snapshot = assert_preflight(manifest, preflight["payload"])
    evidence.record(
        {
            "event_key": "preservation-baseline",
            "classification": "MATCH",
            "cohort_snapshot": before_snapshot,
            "noncohort_snapshot": preflight["payload"]["noncohort_snapshot"],
        }
    )
    positive_observer_probe(db, evidence)

    c1_admit = recorded_request(
        evidence,
        "c1-admit",
        lambda: db.query(
            "c1-admit", sql_contract.admit_sql(manifest, "c1"), read_only=False, timeout=25
        ),
        transactional=True,
    )
    try:
        c1_attempt = validate_admission(c1_admit, "C1")
    except Stop:
        recorded_request(
            evidence,
            "c1-durable-reconcile",
            lambda: db.query(
                "c1-durable-reconcile",
                sql_contract.reconcile_sql(manifest, "after-c1-admit-uncertain"),
                read_only=False,
                timeout=30,
            ),
            transactional=False,
        )
        raise
    admitted = recorded_request(
        evidence,
        "c1-durable-reconcile",
        lambda: db.query(
            "c1-durable-reconcile",
            sql_contract.reconcile_sql(manifest, "after-c1-admit", c1_attempt),
            read_only=False,
            timeout=30,
        ),
        transactional=False,
    )
    if not admitted["ok"]:
        raise Stop("C1 admission durable verification unavailable; do not dispatch workers")
    assert_after_c1_admit(manifest, admitted["payload"], c1_attempt, before_snapshot)
    run_c1_concurrency(db, evidence, manifest, c1_attempt, before_snapshot)

    n1_admit = recorded_request(
        evidence,
        "n1-admit",
        lambda: db.query(
            "n1-admit", sql_contract.admit_sql(manifest, "n1"), read_only=False, timeout=25
        ),
        transactional=True,
    )
    n1_error: Stop | None = None
    try:
        validate_admission(n1_admit, "N1")
    except Stop as exc:
        n1_error = exc
    final = recorded_request(
        evidence,
        "final-reconcile",
        lambda: db.query(
            "final-reconcile",
            sql_contract.reconcile_sql(manifest, "final"),
            read_only=False,
            timeout=30,
        ),
        transactional=False,
    )
    if not final["ok"]:
        raise Stop("final durable reconciliation unavailable; outcome is not a pass")
    assert_final(manifest, final["payload"], before_snapshot)
    if n1_error is not None:
        raise Stop(f"N1 response was not certifiable; final reconciliation retained: {n1_error}")
    evidence.record(
        {
            "event_key": "continuation-result",
            "classification": "LIMITED_HOSTED_C01_PASS",
            "limitations": [
                "NO_APPOINTMENT_BINDING_RACE_PROOF",
                "ORIGINAL_F1_RECORDED_REPLAY_REPLIES_REMAIN_MISSING",
                "NO_FULL_WORKFLOW_OR_ACTIVATION_PROOF",
            ],
        }
    )


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--execute", action="store_true")
    parser.add_argument("--approved-package-hash")
    parser.add_argument("--continuation-id")
    return parser.parse_args(argv)


def main(
    argv: list[str] | None = None,
    *,
    environ: Mapping[str, str] | None = None,
    db_factory: Callable[[str, dict[str, Any]], ManagementSQL] = ManagementSQL,
    evidence_factory: Callable[[str, dict[str, str]], EvidenceSink] = FileEvidence,
) -> int:
    args = parse_args(argv)
    manifest = load_manifest()
    package_hash, members = package_identity(manifest)
    if not args.execute:
        print("REFUSED: prepared-only; no environment read, evidence write, or network call occurred.")
        print(f"continuation_id={FIXED_CONTINUATION_ID}")
        print(f"aggregate_package_sha256={package_hash}")
        print("member_sha256=" + canonical_json(members))
        return 2
    if args.approved_package_hash != package_hash:
        print("STOP: exact approved package hash mismatch; no environment/network access.", file=sys.stderr)
        return 3
    if args.continuation_id != FIXED_CONTINUATION_ID:
        print("STOP: fixed continuation identity mismatch; no environment/network access.", file=sys.stderr)
        return 3
    try:
        verify_immutable_local_sources(manifest)
    except Stop as exc:
        print(f"STOP: {exc}; no environment/network access.", file=sys.stderr)
        return 3
    source = os.environ if environ is None else environ
    token = source.get(manifest["project"]["credential_env"], "")
    if len(token) < 20:
        print(
            "STOP: dedicated Management credential absent or malformed; "
            "no evidence directory or network access.",
            file=sys.stderr,
        )
        return 4
    evidence = evidence_factory(package_hash, members)
    db = db_factory(token, manifest)
    try:
        execute(manifest, db, evidence)
    except Stop as exc:
        evidence.record(
            {
                "event_key": "continuation-result",
                "classification": "STOP_PRESERVE_RECONCILE_IF_DISPATCHED",
                "reason": str(exc),
            }
        )
        print(f"STOP: {exc}", file=sys.stderr)
        return 1
    print(
        "LIMITED HOSTED C01 RETAINED-COHORT PASS / ORIGINAL F1 REPLIES STILL MISSING / "
        "APPOINTMENT BINDING AND FULL WORKFLOW NOT PROVEN"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
