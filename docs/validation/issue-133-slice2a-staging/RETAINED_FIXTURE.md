# Governed retained Slice 2A Staging fixture

STATUS: GOVERNED_RETAINED_SYNTHETIC_STAGING_EVIDENCE
RUN: HV133-SLICE2A-STAGING-R1-20261011T041448Z-130dbf2d
STAGING: wnfahklzaxirftyskctd

## Rules

DO_NOT_REUSE
DO_NOT_MUTATE_FINANCIAL_HISTORY
DO_NOT_DELETE_WITHOUT_PRODUCT_OWNER_GATE
NOT_CUSTOMER_DATA
NOT_GVM
NOT_CHASUM_HQ
NOT_PRODUCTION
NOT_GENERAL_STAGING_SEED

Accepted attempts and their linked transactions are intentionally retained: immutable-history guards prohibit ordinary deletion. Parent deletion is not a cleanup workaround.

## History

The original A1–A4 hosted proof passed. Its SCALE setup failed with SQLSTATE 23505 because Owner A already owned Business A. That separate transaction rolled back without SCALE rows. The current PO gate permits read-only reconciliation and a separate temporary SCALE owner; it does not permit changing this retained financial history. Fresh full-row reconciliation found zero drift.

## Exact inventory

- Owner A: 02ef6744-cdbf-4a83-af2c-a014df703da4; slice2a-a-20261011t041448z-130dbf2d@validation.invalid
- Owner B: f855d46c-3102-48bb-b0ae-761347775664; slice2a-b-20261011t041448z-130dbf2d@validation.invalid
- Business A: 2fda0078-bd02-4622-8686-1772f29ebd1a; slug slice2a-retained-a-20261011t041448z-130dbf2d
- Business B: cd81e7aa-4f45-49f1-9b86-a81356633ece; slug slice2a-retained-b-20261011t041448z-130dbf2d
- location: 8a1d5edf-2fab-4003-b07a-7d878a7e82c6
- service: e315a564-908e-4eb6-8ada-642279f915e9
- staff: d0ee3bc9-ab3a-476b-8b75-f3372cc445cf
- bCustomer: 255006af-721a-4a7e-bcd8-2ba80775113c
- bTransaction: 5f76124e-b6a2-41c8-bb03-9269d72fcf16

### A1

- customer: e18f1bf5-ac4b-4d11-81ec-cd786602c38e
- appointment: 48dd09c9-4dc6-41be-aa92-9d3bc0bf980f
- attempt: 33ed45e2-d024-45fd-9bae-9907206397b3
- attemptKey: d1e77820-3e23-492a-ae9d-9e45134e3c25
- transaction: 640bb219-457b-443b-8aad-e4a72dc749a7

### A2

- customer: 044b151a-f81d-4967-a69a-49fb1befda52
- appointment: aa5eaa4b-ce48-4aad-8b48-54fbeacd3870
- attempt: f886c092-1667-41dc-bfde-2410808fabf6
- attemptKey: dc2344b8-0b3e-461a-b93c-31248378ee3f
- transaction: 3f41d726-8df8-4fdc-a535-2a7156161a5c
- refund: 537d11f0-dcd8-4004-bbe5-3687ac22eb6b

### A3

- customer: aad198d0-8b2f-4497-81a7-21c1f51ff1a9
- appointment: 24ab4f2e-5dc1-487d-b194-e29d5983f80a
- attempt: 2fc400c4-0427-4a36-abac-a65089a1f6a4
- attemptKey: 64ff1b39-19cc-4f8c-a8fb-03a3799ea77f
- transaction: c37832a0-6676-4fa6-bcbc-f17ac7c75bc9
- refund: 1b8d504c-fa05-4413-9697-70436d5011c0

### A4

- customer: 2384e047-8e7d-4860-a826-bb5c653107dc
- appointment: 87e40f48-b23f-4bcb-b92f-0169d638a71f
- attempt: 7e7c127c-5519-407a-bf14-57aa684b4bcb
- attemptKey: 861ae0b0-2c96-4f86-a541-42bd77b8870b
- transaction: 9c88c217-5b00-4e48-ab26-b7475e98089b
- refund: 1c95aa11-71c1-47dc-bc44-bfee2ae809e6

### staff_services

- {"duration_override_minutes": null, "price_override": null, "service_id": "e315a564-908e-4eb6-8ada-642279f915e9", "staff_id": "d0ee3bc9-ab3a-476b-8b75-f3372cc445cf"}

### staff_locations

- {"created_at": "2026-10-11T04:16:43.236783+00:00", "is_primary": true, "location_id": "8a1d5edf-2fab-4003-b07a-7d878a7e82c6", "staff_id": "d0ee3bc9-ab3a-476b-8b75-f3372cc445cf"}

### service_locations

- {"is_primary": true, "location_id": "8a1d5edf-2fab-4003-b07a-7d878a7e82c6", "service_id": "e315a564-908e-4eb6-8ada-642279f915e9"}

### staff_working_hours

- {"day_of_week": 0, "end_time": "17:00:00", "id": "21af5492-3f32-4afd-8cad-6be92f3794fa", "is_working": false, "lunch_end_time": null, "lunch_start_time": null, "overtime_eligible": false, "staff_id": "d0ee3bc9-ab3a-476b-8b75-f3372cc445cf", "start_time": "09:00:00"}
- {"day_of_week": 1, "end_time": "17:00:00", "id": "7042a9a5-aa2f-4544-bed7-e7dde7651e71", "is_working": true, "lunch_end_time": null, "lunch_start_time": null, "overtime_eligible": false, "staff_id": "d0ee3bc9-ab3a-476b-8b75-f3372cc445cf", "start_time": "09:00:00"}
- {"day_of_week": 2, "end_time": "17:00:00", "id": "1f48293b-7c69-472b-aed9-7e16637ca690", "is_working": true, "lunch_end_time": null, "lunch_start_time": null, "overtime_eligible": false, "staff_id": "d0ee3bc9-ab3a-476b-8b75-f3372cc445cf", "start_time": "09:00:00"}
- {"day_of_week": 3, "end_time": "17:00:00", "id": "2c3b5b99-bd05-4adf-afb4-8dda24cd9b90", "is_working": true, "lunch_end_time": null, "lunch_start_time": null, "overtime_eligible": false, "staff_id": "d0ee3bc9-ab3a-476b-8b75-f3372cc445cf", "start_time": "09:00:00"}
- {"day_of_week": 4, "end_time": "17:00:00", "id": "c771770f-84b9-4def-a2d5-3e67311bae3e", "is_working": true, "lunch_end_time": null, "lunch_start_time": null, "overtime_eligible": false, "staff_id": "d0ee3bc9-ab3a-476b-8b75-f3372cc445cf", "start_time": "09:00:00"}
- {"day_of_week": 5, "end_time": "17:00:00", "id": "62d63881-eb84-443e-a891-c46533e99acb", "is_working": true, "lunch_end_time": null, "lunch_start_time": null, "overtime_eligible": false, "staff_id": "d0ee3bc9-ab3a-476b-8b75-f3372cc445cf", "start_time": "09:00:00"}
- {"day_of_week": 6, "end_time": "17:00:00", "id": "7b379bef-b674-4631-beb6-730befbc6853", "is_working": false, "lunch_end_time": null, "lunch_start_time": null, "overtime_eligible": false, "staff_id": "d0ee3bc9-ab3a-476b-8b75-f3372cc445cf", "start_time": "09:00:00"}

### auth_identities

- {"id": "abe9936c-e807-4191-90b5-52cc012fb1f3", "provider": "email", "user_id": "02ef6744-cdbf-4a83-af2c-a014df703da4"}
- {"id": "f6a22e48-1a74-49b1-b5f3-600bdb4d0005", "provider": "email", "user_id": "f855d46c-3102-48bb-b0ae-761347775664"}

## Counts

- staff: 1
- services: 1
- customers: 5
- locations: 1
- businesses: 2
- appointments: 4
- commerce_refunds: 3
- commerce_transactions: 5
- commerce_payment_attempts: 4
- staff_services: 1
- staff_locations: 1
- service_locations: 1
- staff_working_hours: 7
- auth_identities: 2
- auth_users: 2

Public retained rows: 36. Auth users: 2. Auth email identities: 2. No new projection/event/document/communication rows found.

## Accepted hosted results

A1 EXACT CAD5000 collected/deposit cents; A2/A3/A4 HELD with REFUND_EVIDENCE_INCONSISTENT. A2 and A3 domain results identical. N1 cross-business witness, privacy, customer embed, all six FK hints and foreign-customer fail-closed control passed. Original raw responses are preserved unchanged in this directory.
