/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://sihxbidxdclkjgrtwqft.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_alGPaPx8hw0hrjSClcYN5g_UVH2H3yJ";

async function safeInsert(supabase, payload) {
  // Try full payload first
  const { data, error } = await supabase.from("payments").insert(payload).select().single();
  if (!error) return { data, error: null };

  // Fallback for check constraint or missing column
  let safeJenis = payload.jenis;
  if (["denda_keterlambatan", "ganti_rugi", "tagihan_kekurangan"].includes(safeJenis)) {
    safeJenis = "denda";
  } else if (safeJenis === "refund_pembayaran") {
    safeJenis = "refund_deposit";
  }

  let safeStatus = payload.status;
  if (["menunggu_pembayaran", "menunggu_transfer"].includes(safeStatus)) {
    safeStatus = "menunggu_verifikasi";
  }

  let safeMetode = payload.metode || "Manual";
  if (payload.catatan) {
    safeMetode = `${safeMetode} (${payload.catatan})`;
  }

  const basicPayload = {
    booking_id: payload.booking_id,
    jenis: safeJenis,
    jumlah: payload.jumlah,
    metode: safeMetode.substring(0, 150),
    status: safeStatus,
    dibayar_pada: payload.dibayar_pada || new Date().toISOString(),
    diverifikasi_oleh: payload.diverifikasi_oleh || null,
  };

  return await supabase.from("payments").insert(basicPayload).select().single();
}

async function run() {
  console.log("Connecting to Supabase at", SUPABASE_URL);
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Authenticate as Admin
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: "admin@pirantiku.com",
    password: "AdminPirantiKu123!",
  });

  if (authError || !authData.session) {
    console.error("Auth error:", authError);
    process.exit(1);
  }

  const adminId = authData.user.id;
  console.log("Authenticated as Admin:", adminId);

  // 1. Fetch all returns
  const { data: returns, error: rErr } = await supabase
    .from("booking_returns")
    .select(`
      id,
      booking_id,
      tanggal_dikembalikan,
      hari_terlambat,
      denda_terlambat,
      total_ganti_rugi,
      deposit_dikembalikan,
      catatan,
      booking:bookings(
        id,
        kode_booking,
        status,
        deposit,
        user_id
      )
    `);

  if (rErr) {
    console.error("Error fetching returns:", rErr);
    process.exit(1);
  }

  console.log(`Found ${returns.length} return records.`);

  for (const ret of returns) {
    const booking = ret.booking;
    if (!booking) {
      console.log(`Skipping return #${ret.id}: no booking linked.`);
      continue;
    }

    console.log(`\nEvaluating return #${ret.id} for Booking #${booking.kode_booking} (ID: ${booking.id})`);
    console.log(`- Denda terlambat: Rp ${Number(ret.denda_terlambat || 0).toLocaleString("id-ID")}`);
    console.log(`- Ganti rugi: Rp ${Number(ret.total_ganti_rugi || 0).toLocaleString("id-ID")}`);
    console.log(`- Deposit booking: Rp ${Number(booking.deposit || 0).toLocaleString("id-ID")}`);
    console.log(`- Status booking saat ini: ${booking.status}`);

    // Check existing return payments for this booking using guaranteed columns
    const { data: existingPayments, error: pErr } = await supabase
      .from("payments")
      .select("id, jenis, jumlah, metode, status")
      .eq("booking_id", booking.id);

    if (pErr) {
      console.error("Error fetching payments:", pErr);
      continue;
    }

    const hasReturnFinancials = (existingPayments || []).some((p) =>
      ["denda", "denda_keterlambatan", "ganti_rugi", "tagihan_kekurangan", "refund_deposit"].includes(p.jenis)
    );

    if (hasReturnFinancials) {
      console.log(`- Sudah memiliki catatan keuangan pengembalian. Melewati.`);
      continue;
    }

    const denda = Math.round(Number(ret.denda_terlambat) || 0);
    const gantiRugi = Math.round(Number(ret.total_ganti_rugi) || 0);
    const totalKewajiban = denda + gantiRugi;
    const depositAwal = Math.round(Number(booking.deposit) || 0);
    const potonganDeposit = Math.min(depositAwal, totalKewajiban);

    const now = ret.tanggal_dikembalikan || new Date().toISOString();

    // 1. Potongan deposit untuk denda keterlambatan
    let potongDenda = 0;
    if (denda > 0 && potonganDeposit > 0) {
      potongDenda = Math.min(denda, potonganDeposit);
      const { error: insErr } = await safeInsert(supabase, {
        booking_id: booking.id,
        jenis: "denda_keterlambatan",
        arah: "masuk",
        jumlah: potongDenda,
        metode: "Potongan Deposit",
        status: "terverifikasi",
        sumber: "potongan_deposit",
        catatan: `[Backfill] Potongan deposit denda ${ret.hari_terlambat || 0} hari #${booking.kode_booking}`,
        dicatat_oleh: adminId,
        diverifikasi_oleh: adminId,
        tanggal_transaksi: now,
        dibayar_pada: now,
      });
      if (insErr) {
        console.error("Gagal insert potong denda:", insErr);
      } else {
        console.log(`+ Tercatat denda_keterlambatan (potongan deposit): Rp ${potongDenda.toLocaleString("id-ID")}`);
      }
    }

    // 2. Potongan deposit untuk ganti rugi kerusakan
    const sisaPotonganUntukKerusakan = potonganDeposit - potongDenda;
    let potongKerusakan = 0;
    if (gantiRugi > 0 && sisaPotonganUntukKerusakan > 0) {
      potongKerusakan = Math.min(gantiRugi, sisaPotonganUntukKerusakan);
      const { error: insErr } = await safeInsert(supabase, {
        booking_id: booking.id,
        jenis: "ganti_rugi",
        arah: "masuk",
        jumlah: potongKerusakan,
        metode: "Potongan Deposit",
        status: "terverifikasi",
        sumber: "potongan_deposit",
        catatan: `[Backfill] Potongan deposit ganti rugi unit rusak #${booking.kode_booking}`,
        dicatat_oleh: adminId,
        diverifikasi_oleh: adminId,
        tanggal_transaksi: now,
        dibayar_pada: now,
      });
      if (insErr) {
        console.error("Gagal insert potong ganti rugi:", insErr);
      } else {
        console.log(`+ Tercatat ganti_rugi (potongan deposit): Rp ${potongKerusakan.toLocaleString("id-ID")}`);
      }
    }

    // 3. Jika deposit bersisa -> Catat refund deposit
    if (depositAwal > totalKewajiban) {
      const sisaRefund = depositAwal - totalKewajiban;
      const { error: insErr } = await safeInsert(supabase, {
        booking_id: booking.id,
        jenis: "refund_deposit",
        arah: "keluar",
        jumlah: sisaRefund,
        metode: "Transfer Bank",
        status: "menunggu_transfer",
        catatan: `[Backfill] Pengembalian sisa deposit jaminan #${booking.kode_booking}`,
        dicatat_oleh: adminId,
        tanggal_transaksi: now,
        dibayar_pada: now,
      });
      if (insErr) {
        console.error("Gagal insert refund deposit:", insErr);
      } else {
        console.log(`+ Tercatat refund_deposit: Rp ${sisaRefund.toLocaleString("id-ID")}`);
      }
    }

    // 4. Jika total kewajiban > deposit -> Kurang Bayar!
    if (totalKewajiban > depositAwal) {
      const shortfall = totalKewajiban - depositAwal;
      const { error: insErr } = await safeInsert(supabase, {
        booking_id: booking.id,
        jenis: "tagihan_kekurangan",
        arah: "masuk",
        jumlah: shortfall,
        metode: "Menunggu Pembayaran",
        status: "menunggu_pembayaran",
        sumber: "backfill",
        catatan: `[Backfill] Tagihan kekurangan denda & ganti rugi #${booking.kode_booking}`,
        dicatat_oleh: adminId,
        tanggal_transaksi: now,
        dibayar_pada: now,
      });
      if (insErr) {
        console.error("Gagal insert tagihan kekurangan:", insErr);
      } else {
        console.log(`+ Tercatat tagihan_kekurangan: Rp ${shortfall.toLocaleString("id-ID")}`);
      }

      // Update status booking menjadi 'bermasalah'
      if (booking.status !== "bermasalah") {
        const { error: upErr } = await supabase
          .from("bookings")
          .update({
            status: "bermasalah",
            catatan_admin: `Kurang bayar denda/ganti rugi sebesar Rp ${shortfall.toLocaleString("id-ID")}`,
          })
          .eq("id", booking.id);
        if (upErr) {
          console.error("Gagal update booking status bermasalah:", upErr);
        } else {
          console.log(`+ Status booking diubah menjadi 'bermasalah'.`);
        }
      }
    }
  }

  console.log("\n=== Backfill Selesai! ===");
}

run().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
