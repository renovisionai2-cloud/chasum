from __future__ import annotations

import json
import sys
import threading
import unittest
from pathlib import Path
from unittest import mock

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import harness
import sql_contract


def snapshot() -> dict[str, list[str]]:
    counts = {
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
    return {key: [str(value), f"digest-{key}"] for key, value in counts.items()}


def preflight_payload(manifest: dict, **overrides: object) -> dict:
    payload = {
        "protocol": harness.PROTOCOL,
        "transaction_read_only": True,
        "server17": True,
        "observer_exact": True,
        "observer_capable": True,
        "writer_set_capable": True,
        "foundation_identity": True,
        "r1a_identity": True,
        "admit_body_identity": True,
        "commit_body_identity": True,
        "function_acl": True,
        "rls_enabled": True,
        "writer_acl": True,
        "exact_auth": True,
        "retained_attempts_exact": True,
        "retained_tuples_exact": True,
        "retained_ledgers_exact": True,
        "retained_event_obligation_exact": True,
        "global_financial_counts_exact": True,
        "parent_scope_total_exact": True,
        "c1_n1_absent": True,
        "r1_unchanged": True,
        "no_active_scope_sessions": True,
        "cohort_jobs_send_intents_zero": True,
        "exact_parent_counts": {
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
        },
        "sequence": {
            "last_value": "11",
            "is_called": True,
            "increment": "1",
            "cache": "1",
            "cycle": False,
        },
        "cohort_snapshot": snapshot(),
        "noncohort_snapshot": manifest["noncohort_baselines"],
    }
    payload.update(overrides)
    return payload


def after_c1_payload(
    manifest: dict, attempt_id: str, transaction_id: str, *, durable_ok: bool = True
) -> dict:
    ledger_count = 1 if durable_ok else 0
    return {
        "protocol": harness.PROTOCOL,
        "stage": "after-c1",
        "counts": {
            "attempts": 5,
            "accepted_attempts": 4,
            "requested_attempts": 1,
            "events": 10,
            "requested_events": 5,
            "accepted_events": 4,
            "conflict_events": 1,
            "linked_ledgers": 4 if durable_ok else 3,
            "ledger_total_cents": 18100 if durable_ok else 18000,
            "obligations": 16 if durable_ok else 12,
            "pending_obligations": 15 if durable_ok else 12,
            "not_required_obligations": 1 if durable_ok else 0,
        },
        "c1": {
            "attempt_id": attempt_id,
            "execution_state": "ACCEPTED" if durable_ok else "REQUESTED",
            "ledger_id": transaction_id if durable_ok else None,
            "ledger_count": ledger_count,
            "event_count": 2 if durable_ok else 1,
            "obligation_count": 4 if durable_ok else 0,
            "pending_count": 3 if durable_ok else 0,
            "not_required_appointment_cache": durable_ok,
        },
        "n1_state": None,
        "n1": {
            "attempt_count": 0,
            "event_count": 0,
            "ledger_count": 0,
            "obligation_count": 0,
        },
        "r1_state": "REQUESTED",
        "global_counts": {
            "attempts": 5,
            "events": 10 if durable_ok else 9,
            "linked_ledgers": 4 if durable_ok else 3,
            "obligations": 16 if durable_ok else 12,
        },
        "auth_users": 2,
        "auth_identities": 2,
        "cohort_jobs": 0,
        "cohort_send_intents": 0,
        "sequence": {"last_value": "13" if durable_ok else "12", "is_called": True},
        "cohort_snapshot": snapshot(),
        "noncohort_snapshot": manifest["noncohort_baselines"],
    }


def after_admit_payload(manifest: dict, attempt_id: str) -> dict:
    payload = after_c1_payload(
        manifest, attempt_id, "22222222-2222-4222-8222-222222222222", durable_ok=False
    )
    payload["stage"] = "after-c1-admit"
    payload["counts"] = {
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
    payload["c1"]["attempt_id"] = attempt_id
    payload["sequence"] = {"last_value": "12", "is_called": True}
    return payload


class FakeDB:
    def __init__(
        self,
        manifest: dict,
        *,
        holder_error: bool = False,
        failed_worker: int | None = None,
        durable_ok: bool = True,
        preflight_overrides: dict | None = None,
    ):
        self.manifest = manifest
        self.holder_error = holder_error
        self.failed_worker = failed_worker
        self.durable_ok = durable_ok
        self.preflight_overrides = preflight_overrides or {}
        self.calls: list[str] = []
        self.lock = threading.Lock()
        self.attempt_id = "11111111-1111-4111-8111-111111111111"
        self.transaction_id = "22222222-2222-4222-8222-222222222222"

    def query(self, label: str, sql: str, *, read_only: bool, timeout: int) -> harness.HttpResult:
        with self.lock:
            self.calls.append(label)
        if label == "preflight":
            payload = preflight_payload(self.manifest, **self.preflight_overrides)
        elif label == "c1-admit":
            payload = {
                "protocol": harness.PROTOCOL,
                "commit_ack": True,
                "backend_identity": {
                    "pid": 9,
                    "session_user": "postgres",
                    "effective_role": "postgres",
                    "writer_role": "service_role",
                },
                "result": {
                    "outcome": "ADMITTED",
                    "attempt_id": self.attempt_id,
                    "execution_state": "REQUESTED",
                    "conflict_event_id": None,
                },
            }
        elif label == "c1-holder":
            if self.holder_error:
                raise harness.RequestFailure("holder failed", http_status=400)
            payload = {
                "protocol": harness.PROTOCOL,
                "commit_ack": True,
                "backend_identity": {
                    "pid": 10,
                    "session_user": "postgres",
                    "effective_role": "postgres",
                },
                "witness": {
                    "holder_pid": 10,
                    "workers": [
                        {
                            "pid": 11,
                            "state": "active",
                            "wait_event_type": "Lock",
                            "wait_event": "transactionid",
                        },
                        {
                            "pid": 12,
                            "state": "active",
                            "wait_event_type": "Lock",
                            "wait_event": "tuple",
                        },
                    ],
                    "blocker_chain": [
                        {"worker_pid": 11, "pid": 11, "path": [11]},
                        {"worker_pid": 11, "pid": 10, "path": [11, 10]},
                        {"worker_pid": 12, "pid": 12, "path": [12]},
                        {"worker_pid": 12, "pid": 11, "path": [12, 11]},
                        {"worker_pid": 12, "pid": 10, "path": [12, 11, 10]},
                    ],
                },
            }
        elif label.startswith("c1-worker-"):
            index = int(label[-1])
            if self.failed_worker == index:
                raise harness.RequestFailure("worker timeout", timed_out=True)
            payload = {
                "protocol": harness.PROTOCOL,
                "commit_ack": True,
                "backend_identity": {
                    "pid": 10 + index,
                    "session_user": "postgres",
                    "effective_role": "postgres",
                    "writer_role": "service_role",
                },
                "result": {
                    "outcome": "RECORDED" if index == 1 else "REPLAY",
                    "attempt_id": self.attempt_id,
                    "transaction_id": self.transaction_id,
                    "recorded": True,
                    "synchronization": "PENDING",
                },
            }
        elif label == "c1-holder-ready":
            payload = {"protocol": harness.PROTOCOL, "ready": True, "backend_pid": 10}
        elif label == "c1-durable-reconcile" and "after-c1-admit" in sql:
            payload = after_admit_payload(self.manifest, self.attempt_id)
        elif label == "c1-durable-reconcile":
            payload = after_c1_payload(
                self.manifest, self.attempt_id, self.transaction_id, durable_ok=self.durable_ok
            )
        else:
            raise AssertionError(f"unexpected fake request {label}")
        return harness.HttpResult(status=200, payload=payload)


class HarnessOfflineTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.manifest = harness.load_manifest()

    def test_role_and_observer_layout_is_explicit(self) -> None:
        sql = sql_contract.holder_sql(
            self.manifest, "11111111-1111-4111-8111-111111111111", "deadbeef"
        ).lower()
        lock_at = sql.index("for update")
        set_role_at = sql.index("set local role service_role")
        reset_at = sql.index("reset role")
        observe_at = sql.index("pg_stat_clear_snapshot")
        self.assertLess(set_role_at, lock_at)
        self.assertLess(lock_at, reset_at)
        self.assertLess(reset_at, observe_at)
        self.assertIn("wait_event_type='lock'", sql)
        self.assertIn("blocking_pids", sql)
        self.assertIn("with recursive waiters", sql)
        self.assertIn("bool_or(pid=holder)", sql)
        probe = sql_contract.observer_probe_sql("read", "deadbeef", 123)
        self.assertIn("pg_blocking_pids(pid)=array[123]::integer[]", probe)

    def test_masked_observer_fails_before_payment_dispatch(self) -> None:
        db = FakeDB(self.manifest, preflight_overrides={"observer_capable": False})
        evidence = harness.MemoryEvidence()
        with self.assertRaisesRegex(harness.Stop, "before mutation"):
            harness.execute(self.manifest, db, evidence)
        self.assertEqual(db.calls, ["preflight"])

    def test_holder_failure_preserves_both_worker_records(self) -> None:
        db = FakeDB(self.manifest, holder_error=True)
        evidence = harness.MemoryEvidence()
        with self.assertRaisesRegex(harness.Stop, "partial/uncertain"):
            harness.run_c1_concurrency(
                db, evidence, self.manifest, db.attempt_id, snapshot(), nonce="deadbeef"
            )
        finished = {
            row["request_label"]: row
            for row in evidence.rows
            if row.get("event_key") == "request-finish"
        }
        self.assertFalse(finished["c1-holder"]["ok"])
        self.assertTrue(finished["c1-worker-1"]["ok"])
        self.assertTrue(finished["c1-worker-2"]["ok"])
        durable = next(
            row
            for row in evidence.rows
            if row.get("event_key") == "c1-durable-ledger-assertion"
        )
        self.assertEqual(durable["classification"], "MATCH")

    def test_one_worker_timeout_keeps_sibling(self) -> None:
        db = FakeDB(self.manifest, failed_worker=1)
        evidence = harness.MemoryEvidence()
        with self.assertRaises(harness.Stop):
            harness.run_c1_concurrency(
                db, evidence, self.manifest, db.attempt_id, snapshot(), nonce="deadbeef"
            )
        finished = [
            row for row in evidence.rows if row.get("event_key") == "request-finish"
        ]
        first = next(row for row in finished if row["request_label"] == "c1-worker-1")
        second = next(row for row in finished if row["request_label"] == "c1-worker-2")
        self.assertEqual(first["commit_ack"], "UNKNOWN")
        self.assertTrue(first["outcome_unknown"])
        self.assertTrue(second["ok"])
        self.assertEqual(second["result"]["outcome"], "REPLAY")

    def test_missing_malformed_or_mismatched_identity_rejects(self) -> None:
        base = {
            "ok": True,
            "commit_ack": True,
            "backend_identity": {
                "pid": 9,
                "session_user": "postgres",
                "effective_role": "postgres",
                "writer_role": "service_role",
            },
            "result": {
                "outcome": "ADMITTED",
                "attempt_id": "11111111-1111-4111-8111-111111111111",
                "execution_state": "REQUESTED",
                "conflict_event_id": None,
            },
        }
        for value in (None, "not-a-uuid"):
            changed = json.loads(json.dumps(base))
            changed["result"]["attempt_id"] = value
            with self.subTest(value=value), self.assertRaises(harness.Stop):
                harness.validate_admission(changed, "C1")
        db = FakeDB(self.manifest)
        evidence = harness.MemoryEvidence()
        original = db.query

        def mismatch(label: str, sql: str, *, read_only: bool, timeout: int) -> harness.HttpResult:
            response = original(label, sql, read_only=read_only, timeout=timeout)
            if label == "c1-worker-2":
                response.payload["result"]["attempt_id"] = "33333333-3333-4333-8333-333333333333"
            return response

        db.query = mismatch  # type: ignore[method-assign]
        with self.assertRaises(harness.Stop):
            harness.run_c1_concurrency(
                db, evidence, self.manifest, db.attempt_id, snapshot(), nonce="deadbeef"
            )

    def test_http_ack_without_durable_verification_is_not_pass(self) -> None:
        db = FakeDB(self.manifest, durable_ok=False)
        evidence = harness.MemoryEvidence()
        with self.assertRaisesRegex(harness.Stop, "partial/uncertain"):
            harness.run_c1_concurrency(
                db, evidence, self.manifest, db.attempt_id, snapshot(), nonce="deadbeef"
            )

    def test_completion_bound_uncertainty_stops_even_if_late_results_pass(self) -> None:
        db = FakeDB(self.manifest)
        evidence = harness.MemoryEvidence()

        def report_pending(futures: tuple, timeout: int) -> tuple[set, set]:
            return set(futures[1:]), {futures[0]}

        with mock.patch.object(harness, "wait", side_effect=report_pending):
            with self.assertRaisesRegex(harness.Stop, "partial/uncertain"):
                harness.run_c1_concurrency(
                    db, evidence, self.manifest, db.attempt_id, snapshot(), nonce="deadbeef"
                )
        self.assertTrue(
            any(row.get("event_key") == "dispatch-uncertainty" for row in evidence.rows)
        )

    def test_n1_not_reached_when_concurrency_fails(self) -> None:
        db = FakeDB(self.manifest)
        evidence = harness.MemoryEvidence()
        with mock.patch.object(harness, "positive_observer_probe", return_value=None), mock.patch.object(
            harness, "run_c1_concurrency", side_effect=harness.Stop("forced concurrency stop")
        ):
            with self.assertRaisesRegex(harness.Stop, "forced concurrency stop"):
                harness.execute(self.manifest, db, evidence)
        self.assertIn("c1-admit", db.calls)
        self.assertNotIn("n1-admit", db.calls)

    def test_existing_cohort_is_never_redispatched(self) -> None:
        c1_sql = sql_contract.admit_sql(self.manifest, "c1")
        n1_sql = sql_contract.admit_sql(self.manifest, "n1")
        for name in ("d1", "d2", "f1", "r1"):
            old_key = self.manifest["retained_financial"][name]["attempt_key"]
            self.assertNotIn(old_key, c1_sql)
            self.assertNotIn(old_key, n1_sql)
        self.assertIn(self.manifest["new_scope"]["c1"]["attempt_key"], c1_sql)
        self.assertIn(self.manifest["new_scope"]["n1"]["attempt_key"], n1_sql)

    def test_scope_or_digest_drift_stops_before_mutation(self) -> None:
        for changed in (
            {"c1_n1_absent": False},
            {"noncohort_snapshot": {"businesses": ["4", "drift"]}},
        ):
            payload = preflight_payload(self.manifest, **changed)
            with self.subTest(changed=changed), self.assertRaises(harness.Stop):
                harness.assert_preflight(self.manifest, payload)

    def test_exact_planned_count_arithmetic(self) -> None:
        harness.validate_arithmetic(self.manifest)
        changed = json.loads(json.dumps(self.manifest))
        changed["expected_final"]["events"] = 12
        with self.assertRaisesRegex(harness.Stop, "arithmetic"):
            harness.validate_arithmetic(changed)

    def test_all_pinned_local_sources_match(self) -> None:
        harness.verify_immutable_local_sources(self.manifest)

    def test_default_refusal_precedes_environment_and_network(self) -> None:
        class ExplodingEnvironment(dict):
            def get(self, key: object, default: object = None) -> object:
                raise AssertionError("environment must not be read")

        called = False

        def db_factory(token: str, manifest: dict) -> harness.ManagementSQL:
            nonlocal called
            called = True
            raise AssertionError("network adapter must not be created")

        with mock.patch("builtins.print"):
            result = harness.main([], environ=ExplodingEnvironment(), db_factory=db_factory)
        self.assertEqual(result, 2)
        self.assertFalse(called)


if __name__ == "__main__":
    unittest.main()
