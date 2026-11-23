import test from "node:test";
import assert from "node:assert/strict";
import {
  isiHariKosong,
  hitungBatasSumbuY,
  formatRupiahRingkas,
  formatTanggalIndoPenuh,
} from "../lib/chart-utils.ts";

test("Chart Utils - Skenario 1: Tanpa Transaksi (data kosong)", () => {
  const result = isiHariKosong([], "2026-11-01", "2026-11-05");
  assert.equal(result.length, 5);
  assert.deepEqual(result, [
    { tanggal: "2026-11-01", total: 0 },
    { tanggal: "2026-11-02", total: 0 },
    { tanggal: "2026-11-03", total: 0 },
    { tanggal: "2026-11-04", total: 0 },
    { tanggal: "2026-11-05", total: 0 },
  ]);
});

test("Chart Utils - Skenario 2: 1 Transaksi di dalam rentang", () => {
  const data = [{ tanggal: "2026-11-03", total: 250000 }];
  const result = isiHariKosong(data, "2026-11-01", "2026-11-05");
  assert.equal(result.length, 5);
  assert.equal(result[0].total, 0);
  assert.equal(result[1].total, 0);
  assert.equal(result[2].tanggal, "2026-11-03");
  assert.equal(result[2].total, 250000);
  assert.equal(result[3].total, 0);
  assert.equal(result[4].total, 0);
});

test("Chart Utils - Skenario 3: Beberapa transaksi di hari yang sama", () => {
  const data = [
    { tanggal: "2026-11-02", total: 100000 },
    { tanggal: "2026-11-02", total: 150000 },
    { date: "2026-11-02T14:30:00Z", amount: 50000 },
  ];
  const result = isiHariKosong(data, "2026-11-01", "2026-11-03");
  assert.equal(result.length, 3);
  assert.equal(result[0].total, 0);
  assert.equal(result[1].tanggal, "2026-11-02");
  assert.equal(result[1].total, 300000); // 100rb + 150rb + 50rb
  assert.equal(result[2].total, 0);
});

test("Chart Utils - Skenario 4: Rentang 1 hari (dari === sampai)", () => {
  const data = [{ tanggal: "2026-11-23", total: 508800 }];
  const result = isiHariKosong(data, "2026-11-23", "2026-11-23");
  assert.equal(result.length, 1);
  assert.deepEqual(result[0], {
    tanggal: "2026-11-23",
    total: 508800,
  });
});

test("Chart Utils - Skenario 5: Lintas batas bulan (Oktober ke November)", () => {
  const data = [
    { tanggal: "2026-10-31", total: 75000 },
    { tanggal: "2026-11-01", total: 120000 },
  ];
  const result = isiHariKosong(data, "2026-10-30", "2026-11-03");
  assert.equal(result.length, 5);
  assert.equal(result[0].tanggal, "2026-10-30");
  assert.equal(result[0].total, 0);
  assert.equal(result[1].tanggal, "2026-10-31");
  assert.equal(result[1].total, 75000);
  assert.equal(result[2].tanggal, "2026-11-01");
  assert.equal(result[2].total, 120000);
  assert.equal(result[3].tanggal, "2026-11-02");
  assert.equal(result[3].total, 0);
  assert.equal(result[4].tanggal, "2026-11-03");
  assert.equal(result[4].total, 0);
});

test("Chart Utils - Skenario 6: Pembulatan Sumbu Y (Nice Numbers & 4 Interval)", () => {
  // Nilai maksimum nyata di produksi: Rp 508.800
  const yAxis508k = hitungBatasSumbuY(508800);
  assert.equal(yAxis508k.maxAxis, 600000);
  assert.equal(yAxis508k.step, 150000);
  assert.deepEqual(yAxis508k.ticks, [0, 150000, 300000, 450000, 600000]);

  // Nilai 0 (default fallback)
  const yAxisZero = hitungBatasSumbuY(0);
  assert.equal(yAxisZero.maxAxis, 100000);
  assert.equal(yAxisZero.step, 25000);
  assert.deepEqual(yAxisZero.ticks, [0, 25000, 50000, 75000, 100000]);

  // Nilai jutaan: Rp 1.241.700
  const yAxisJutaan = hitungBatasSumbuY(1241700);
  assert.equal(yAxisJutaan.ticks.length, 5);
  assert.ok(yAxisJutaan.maxAxis >= 1241700);
  assert.equal(yAxisJutaan.ticks[0], 0);
  assert.equal(yAxisJutaan.ticks[4], yAxisJutaan.maxAxis);
});

test("Chart Utils - Skenario 7: Format Rupiah Ringkas", () => {
  assert.equal(formatRupiahRingkas(0), "Rp 0");
  assert.equal(formatRupiahRingkas(150000), "Rp 150 rb");
  assert.equal(formatRupiahRingkas(600000), "Rp 600 rb");
  assert.equal(formatRupiahRingkas(1200000), "Rp 1,2 jt");
  assert.equal(formatRupiahRingkas(2000000), "Rp 2 jt");
  assert.equal(formatRupiahRingkas(1500000000), "Rp 1,5 M");
});

test("Chart Utils - Skenario 8: Format Tanggal Indonesia Lengkap", () => {
  assert.equal(formatTanggalIndoPenuh("2026-11-23"), "23 November 2026");
  assert.equal(formatTanggalIndoPenuh("2026-08-17"), "17 Agustus 2026");
  assert.equal(formatTanggalIndoPenuh("2026-01-01"), "1 Januari 2026");
});
