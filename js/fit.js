/* Satu layar seperti prototype Figma.
   Seluruh tampilan didesain di kanvas 1440×900. Di layar desktop/laptop (lebar ≥ 1000px, landscape)
   kanvas itu diskalakan proporsional agar selalu muat satu layar tanpa scroll.
   Lebar kanvas selalu 100% layar: layar yang lebih lebar dari 16:10 memperpanjang kanvas ke samping.
   Layar yang lebih tinggi memperpanjang kanvas ke bawah sampai MAX_H.
   Di HP & tablet portrait, layout responsif biasa (boleh scroll) tetap dipakai.
   Dimuat sinkron di <head> supaya tidak ada kedipan layout saat halaman dibuka. */
(function () {
  var W = 1440, H = 900, MAX_H = 1100, MAX_SCALE = 1.5;
  var root = document.documentElement;
  var set = function (k, v) { root.style.setProperty(k, v); };

  function fit() {
    var vw = window.innerWidth, vh = window.innerHeight;
    var on = vw >= 1000 && vw > vh;
    root.classList.toggle('fit', on);
    if (!on) {
      // layout responsif: panggung maskot mengecil mengikuti lebar kolom
      var col = vw < 768 ? vw - 32 : vw - 152;
      set('--stage-k', Math.min(1, col / 568).toFixed(4));
      return;
    }
    var s = Math.min(vw / W, vh / H, MAX_SCALE);
    var fw = vw / s, fh = Math.min(vh / s, MAX_H);
    set('--fs', s.toFixed(5));
    set('--fw', fw.toFixed(2) + 'px');
    set('--fh', fh.toFixed(2) + 'px');
    set('--fx', '0px');
    set('--fy', ((vh - fh * s) / 2).toFixed(2) + 'px');
    set('--stage-k', '1');
  }

  fit();
  window.addEventListener('resize', fit);
})();
