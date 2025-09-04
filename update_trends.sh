#!/bin/sh
psql "postgres://postgres:postgres@fhv-postgres:5432/fhv" <<EOF
INSERT INTO driver_trends (date, total_drivers, by_borough)
VALUES (
  CURRENT_DATE,
  (SELECT COUNT(*) FROM drivers),
  COALESCE(
    (SELECT jsonb_object_agg(borough, count)
     FROM (SELECT borough, COUNT(*) as count
           FROM drivers
           WHERE borough IS NOT NULL
           GROUP BY borough) t),
    '{}'::jsonb
  )
)
ON CONFLICT (date) DO UPDATE
SET total_drivers = EXCLUDED.total_drivers,
    by_borough = EXCLUDED.by_borough;
EOF
