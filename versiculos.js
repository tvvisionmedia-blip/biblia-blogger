/* Versículos Emergentes para Blogger – detección automática de citas bíblicas */
(function () {
	'use strict';

	var C = window.VersiculosConfig || {};
	if (!C.base) {
		var yo = document.currentScript && document.currentScript.src;
		if (yo) C.base = yo.replace(/[^\/]*$/, '');
	}
	if (!C.base) return;
	var D = {
		base: C.base.replace(/\/?$/, '/'),
		datos: C.datos || 'data/',
		version: C.version === undefined ? 'Reina-Valera 1960' : C.version,
		zona: C.zona || '.post-body, .entry-content, article',
		soloClick: !!C.soloClick,
		abrev: C.abrev !== false,
		libros: [[1, ["Génesis", "Gen", "Gn"]], [2, ["Éxodo", "Ex", "Exo", "Exod"]], [3, ["Levítico", "Lev", "Lv"]], [4, ["Números", "Num", "Nm"]], [5, ["Deuteronomio", "Deut", "Dt"]], [6, ["Josué", "Jos"]], [7, ["Jueces", "Jue", "Jc"]], [8, ["Rut", "Rt"]], [9, ["1 Samuel", "1 Sam", "1 Sm", "1 S"]], [10, ["2 Samuel", "2 Sam", "2 Sm", "2 S"]], [11, ["1 Reyes", "1 Rey", "1 Re", "1 R"]], [12, ["2 Reyes", "2 Rey", "2 Re", "2 R"]], [13, ["1 Crónicas", "1 Cron", "1 Cr"]], [14, ["2 Crónicas", "2 Cron", "2 Cr"]], [15, ["Esdras", "Esd"]], [16, ["Nehemías", "Neh"]], [17, ["Ester", "Esther", "Est"]], [18, ["Job", "Jb"]], [19, ["Salmos", "Salmo", "Sal", "Sl"]], [20, ["Proverbios", "Prov", "Pr"]], [21, ["Eclesiastés", "Ecl", "Ec"]], [22, ["Cantares", "Cantar de los Cantares", "Cant", "Cnt", "Ct"]], [23, ["Isaías", "Isa", "Is"]], [24, ["Jeremías", "Jer", "Jr"]], [25, ["Lamentaciones", "Lam", "Lm"]], [26, ["Ezequiel", "Ez", "Eze"]], [27, ["Daniel", "Dan", "Dn"]], [28, ["Oseas", "Os"]], [29, ["Joel", "Jl"]], [30, ["Amós", "Am"]], [31, ["Abdías", "Abd"]], [32, ["Jonás", "Jon"]], [33, ["Miqueas", "Miq", "Mi"]], [34, ["Nahúm", "Nah", "Na"]], [35, ["Habacuc", "Hab"]], [36, ["Sofonías", "Sof"]], [37, ["Hageo", "Hag"]], [38, ["Zacarías", "Zac"]], [39, ["Malaquías", "Mal"]], [40, ["Mateo", "San Mateo", "Mat", "Mt"]], [41, ["Marcos", "San Marcos", "Mar", "Mc", "Mr"]], [42, ["Lucas", "San Lucas", "Luc", "Lc"]], [43, ["Juan", "San Juan", "Jn"]], [44, ["Hechos", "Hechos de los Apóstoles", "Hech", "Hch"]], [45, ["Romanos", "Rom", "Ro"]], [46, ["1 Corintios", "1 Cor", "1 Co"]], [47, ["2 Corintios", "2 Cor", "2 Co"]], [48, ["Gálatas", "Gal", "Ga"]], [49, ["Efesios", "Ef"]], [50, ["Filipenses", "Flp", "Fil"]], [51, ["Colosenses", "Col"]], [52, ["1 Tesalonicenses", "1 Tes", "1 Ts"]], [53, ["2 Tesalonicenses", "2 Tes", "2 Ts"]], [54, ["1 Timoteo", "1 Tim", "1 Ti"]], [55, ["2 Timoteo", "2 Tim", "2 Ti"]], [56, ["Tito", "Tit"]], [57, ["Filemón", "Flm"]], [58, ["Hebreos", "Heb"]], [59, ["Santiago", "Stg", "Sant"]], [60, ["1 Pedro", "1 Ped", "1 Pe"]], [61, ["2 Pedro", "2 Ped", "2 Pe"]], [62, ["1 Juan", "1 Jn"]], [63, ["2 Juan", "2 Jn"]], [64, ["3 Juan", "3 Jn"]], [65, ["Judas", "Jud"]], [66, ["Apocalipsis", "Apoc", "Ap"]]]
	};

	/* ------------------------------------------------------------------
	 * 1. Construir el reconocedor de libros
	 * ---------------------------------------------------------------- */
	var VARIANTES = { a: 'aáà', e: 'eéè', i: 'iíì', o: 'oóò', u: 'uúüù', n: 'nñ' };
	var SIN_TILDE = { 'á': 'a', 'à': 'a', 'é': 'e', 'è': 'e', 'í': 'i', 'ì': 'i', 'ó': 'o', 'ò': 'o', 'ú': 'u', 'ü': 'u', 'ù': 'u' };

	function base(ch) { ch = ch.toLowerCase(); return SIN_TILDE[ch] || ch; }

	function claseLetra(ch, soloMayuscula) {
		var b = base(ch);
		var set = VARIANTES[b] || b;
		var out = '';
		for (var i = 0; i < set.length; i++) {
			out += set[i].toUpperCase();
			if (!soloMayuscula) out += set[i];
		}
		return out.length > 1 ? '[' + out + ']' : out;
	}

	function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

	function prefijo(n) {
		var romano = ['I', 'II', 'III'][n - 1];
		var ordinal = [
			'[Pp]rimer[ao]?',
			'[Ss]egund[ao]',
			'[Tt]ercer[ao]?'
		][n - 1];
		return '(?:' + n + '\\s*(?:ª|º|era|ero|ra|ro)?\\.?\\s*|' + romano + '\\.?\\s+|' + ordinal + '\\s+(?:de\\s+)?)';
	}

	function patronAlias(alias, esAbrev) {
		var num = 0, nombre = alias;
		var m = /^([123])\s+(.+)$/.exec(alias);
		if (m) { num = +m[1]; nombre = m[2]; }
		var p = '';
		for (var i = 0; i < nombre.length; i++) {
			var ch = nombre[i];
			if (/\s/.test(ch)) p += '\\s+';
			else if (/\p{L}/u.test(ch)) p += claseLetra(ch, esAbrev && i === 0);
			else p += escRe(ch);
		}
		if (esAbrev) p += '\\.?';
		return (num ? prefijo(num) : '') + p;
	}

	function normalizarLibro(txt) {
		var t = txt.toLowerCase().replace(/[. ]/g, ' ').replace(/\s+/g, ' ').trim();
		t = t.replace(/[áàéèíìóòúüù]/g, function (c) { return SIN_TILDE[c]; });
		t = t.replace(/^([123])\s*(?:ª|º|era|ero|ra|ro)?\s*/, '$1')
			.replace(/^(iii)\s+/, '3').replace(/^(ii)\s+/, '2').replace(/^(i)\s+/, '1')
			.replace(/^primer[ao]?\s+(?:de\s+)?/, '1')
			.replace(/^segund[ao]\s+(?:de\s+)?/, '2')
			.replace(/^tercer[ao]?\s+(?:de\s+)?/, '3');
		return t.replace(/\s+/g, '');
	}

	var LIBRO_DE = {};   // nombre normalizado -> id
	var NOMBRE = {};     // id -> nombre canónico
	var alternativas = [];

	D.libros.forEach(function (par) {
		var id = par[0], nombres = par[1];
		NOMBRE[id] = nombres[0];
		nombres.forEach(function (alias, idx) {
			var soloNombre = alias.replace(/^[123]\s+/, '');
			var esAbrev = idx > 0 && soloNombre.length <= 4 && soloNombre.indexOf(' ') < 0;
			if (esAbrev && !D.abrev) return;
			LIBRO_DE[normalizarLibro(alias)] = id;
			alternativas.push({ len: alias.length, re: patronAlias(alias, esAbrev) });
		});
	});
	alternativas.sort(function (a, b) { return b.len - a.len; });

	var N = '(\\d{1,3})';
	var GUION = '\\s*[-–—]\\s*';
	var PATRON = new RegExp(
		'(' + alternativas.map(function (a) { return a.re; }).join('|') + ')' +
		'\\s*' + N + '(\\s*:\\s*|[.,])' + N +                       // capítulo y versículo
		'(?:' + GUION + N + '(?:\\s*:\\s*' + N + ')?)?' +        // rango opcional
		'((?:\\s*,\\s*\\d{1,3}(?:' + GUION + '\\d{1,3})?(?![\\d:]))*)', // lista: ", 18, 20-22"
		'gu'
	);

	/* ------------------------------------------------------------------
	 * 2. Analizar una coincidencia
	 * ---------------------------------------------------------------- */
	function analizar(m) {
		var id = LIBRO_DE[normalizarLibro(m[1])];
		if (!id) return null;
		var c = +m[2], v = +m[4], conDosPuntos = m[3].indexOf(':') >= 0;
		var cola = conDosPuntos ? m[7] : '';
		var texto = conDosPuntos ? m[0] : m[0].slice(0, m[0].length - m[7].length);

		var claves = [], etiqueta = NOMBRE[id] + ' ' + c + ':' + v, cFin = c;
		if (m[5]) {
			if (m[6]) {
				cFin = +m[5];
				claves.push(id + '.' + c + '.' + v + '-' + cFin + '.' + m[6]);
				etiqueta += '–' + cFin + ':' + m[6];
			} else {
				claves.push(id + '.' + c + '.' + v + '-' + m[5]);
				etiqueta += '-' + m[5];
			}
		} else {
			claves.push(id + '.' + c + '.' + v);
		}
		if (cola) {
			cola.split(',').forEach(function (p) {
				p = p.trim(); if (!p) return;
				var r = p.split(/\s*[-–—]\s*/);
				claves.push(id + '.' + cFin + '.' + r[0] + (r[1] ? '-' + r[1] : ''));
				etiqueta += ', ' + r[0] + (r[1] ? '-' + r[1] : '');
			});
		}
		return { texto: texto, claves: claves, etiqueta: etiqueta };
	}

	/* ------------------------------------------------------------------
	 * 3. Buscar citas en la página
	 * ---------------------------------------------------------------- */
	var IGNORAR = /^(SCRIPT|STYLE|TEXTAREA|INPUT|SELECT|OPTION|CODE|PRE|A|BUTTON|NOSCRIPT|H1|TITLE)$/;

	function zonas() {
		var lista;
		try { lista = Array.prototype.slice.call(document.querySelectorAll(D.zona || 'body')); }
		catch (e) { lista = []; }
		if (!lista.length) lista = [document.body];
		// quitar zonas contenidas en otra zona
		return lista.filter(function (z) {
			return !lista.some(function (o) { return o !== z && o.contains(z); });
		});
	}

	function buscar() {
		var hallazgos = [];
		zonas().forEach(function (zona) {
			var walker = document.createTreeWalker(zona, NodeFilter.SHOW_TEXT, {
				acceptNode: function (n) {
					var el = n.parentNode;
					if (!el || IGNORAR.test(el.nodeName)) return NodeFilter.FILTER_REJECT;
					if (!/\d/.test(n.nodeValue)) return NodeFilter.FILTER_REJECT;
					if (el.closest('a, button, .ref-biblica, #popup-versiculo, [contenteditable="true"], .no-versiculos'))
						return NodeFilter.FILTER_REJECT;
					return NodeFilter.FILTER_ACCEPT;
				}
			});
			while (walker.nextNode()) {
				var nodo = walker.currentNode, txt = nodo.nodeValue, m, citas = [];
				PATRON.lastIndex = 0;
				while ((m = PATRON.exec(txt))) {
					var antes = m.index > 0 ? txt[m.index - 1] : '';
					var r = (antes && /[\p{L}\p{N}]/u.test(antes)) ? null : analizar(m);
					var fin = m.index + (r ? r.texto.length : 0);
					if (r && /\d/.test(txt[fin] || '')) r = null;
					if (r) {
						r.inicio = m.index; r.fin = fin;
						citas.push(r);
						PATRON.lastIndex = fin;
					} else {
						PATRON.lastIndex = m.index + 1;
					}
				}
				if (citas.length) hallazgos.push({ nodo: nodo, citas: citas });
			}
		});
		return hallazgos;
	}

	/* ------------------------------------------------------------------
	 * 4. Obtener los textos (con caché)
	 * ---------------------------------------------------------------- */
	var TEXTOS = {};
	var LIBROS = {};

	function cargarLibro(id) {
		if (LIBROS[id]) return LIBROS[id];
		var url = D.base + D.datos + (id < 10 ? '0' : '') + id + '.json';
		LIBROS[id] = fetch(url)
			.then(function (r) { return r.ok ? r.json() : null; })
			.catch(function () { return null; });
		return LIBROS[id];
	}

	// "libro.cap.ver", "libro.cap.ver-ver2" o "libro.cap.ver-cap2.ver2"
	function resolver(datos, clave, max) {
		max = max || 30;
		var m = /^(\d{1,2})\.(\d{1,3})\.(\d{1,3})(?:-(?:(\d{1,3})\.)?(\d{1,3}))?$/.exec(clave);
		if (!m || !datos) return null;
		var c1 = +m[2], v1 = +m[3], c2 = m[4] ? +m[4] : c1, v2 = m[5] ? +m[5] : v1;
		if (!datos[c1] || !datos[c1][v1] || c2 < c1 || (c2 === c1 && v2 < v1)) return null;
		var out = [];
		for (var c = c1; c <= c2 && datos[c]; c++) {
			var desde = c === c1 ? v1 : 1, hasta = c === c2 ? v2 : Infinity;
			for (var v = desde; v <= hasta && datos[c][v]; v++) {
				out.push([c, v, datos[c][v]]);
				if (out.length >= max) { out.push([0, 0, '…']); return out; }
			}
		}
		return out.length ? out : null;
	}

	function obtener(claves) {
		var ids = {};
		claves.forEach(function (k) { ids[k.split('.')[0]] = true; });
		return Promise.all(Object.keys(ids).map(function (id) {
			return cargarLibro(+id).then(function (datos) {
				claves.forEach(function (k) {
					if (k.split('.')[0] === id) TEXTOS[k] = resolver(datos, k);
				});
			});
		}));
	}

	/* ------------------------------------------------------------------
	 * 5. Marcar las citas encontradas
	 * ---------------------------------------------------------------- */
	function marcar(hallazgos) {
		hallazgos.forEach(function (h) {
			var validas = h.citas.filter(function (c) { return TEXTOS[c.claves[0]]; });
			if (!validas.length || !h.nodo.parentNode) return;
			var txt = h.nodo.nodeValue, pos = 0, frag = document.createDocumentFragment();
			validas.forEach(function (c) {
				if (c.inicio > pos) frag.appendChild(document.createTextNode(txt.slice(pos, c.inicio)));
				var s = document.createElement('span');
				s.className = 'ref-biblica';
				s.textContent = txt.slice(c.inicio, c.fin);
				s.tabIndex = 0;
				s.setAttribute('role', 'button');
				s.setAttribute('aria-label', 'Ver ' + c.etiqueta);
				s.dataset.claves = c.claves.join(';');
				s.dataset.etiqueta = c.etiqueta;
				frag.appendChild(s);
				pos = c.fin;
			});
			if (pos < txt.length) frag.appendChild(document.createTextNode(txt.slice(pos)));
			h.nodo.parentNode.replaceChild(frag, h.nodo);
		});
	}

	/* ------------------------------------------------------------------
	 * 6. Ventana emergente
	 * ---------------------------------------------------------------- */
	function crearPopup() {
		var popup = document.createElement('div');
		popup.id = 'popup-versiculo';
		popup.setAttribute('role', 'tooltip');
		document.body.appendChild(popup);
		var actual = null, timer = null;

		function contenido(el) {
			var versos = [];
			el.dataset.claves.split(';').forEach(function (k) {
				if (TEXTOS[k]) versos = versos.concat(TEXTOS[k]);
			});
			popup.innerHTML = '';
			var t = document.createElement('span');
			t.className = 'pv-ref';
			t.textContent = el.dataset.etiqueta;
			popup.appendChild(t);

			var cuerpo = document.createElement('span');
			cuerpo.className = 'pv-texto';
			if (versos.length === 1) {
				cuerpo.textContent = '«' + versos[0][2] + '»';
			} else {
				var capAnterior = null;
				versos.forEach(function (vv, i) {
					if (i > 0) cuerpo.appendChild(document.createTextNode(' '));
					if (vv[0] === 0) { cuerpo.appendChild(document.createTextNode('…')); return; }
					var n = document.createElement('sup');
					n.textContent = (capAnterior !== null && vv[0] !== capAnterior) ? vv[0] + ':' + vv[1] : vv[1];
					capAnterior = vv[0];
					cuerpo.appendChild(n);
					cuerpo.appendChild(document.createTextNode(' ' + vv[2]));
				});
			}
			popup.appendChild(cuerpo);

			if (D.version) {
				var v = document.createElement('span');
				v.className = 'pv-version';
				v.textContent = D.version;
				popup.appendChild(v);
			}
		}

		function mostrar(el) {
			clearTimeout(timer);
			if (actual !== el) contenido(el);
			popup.classList.add('visible');
			var rect = el.getBoundingClientRect();
			var ancho = popup.offsetWidth, alto = popup.offsetHeight;
			var vw = document.documentElement.clientWidth;
			var left = rect.left + window.scrollX + rect.width / 2 - ancho / 2;
			left = Math.max(window.scrollX + 8, Math.min(left, window.scrollX + vw - ancho - 8));
			var top = rect.top + window.scrollY - alto - 10;
			if (rect.top - alto - 10 < 0) top = rect.bottom + window.scrollY + 10;
			popup.style.left = left + 'px';
			popup.style.top = top + 'px';
			actual = el;
		}
		function ocultar(inmediato) {
			clearTimeout(timer);
			var fn = function () { popup.classList.remove('visible'); actual = null; };
			if (inmediato) fn(); else timer = setTimeout(fn, 150);
		}

		if (!D.soloClick) {
			document.addEventListener('mouseover', function (e) {
				var el = e.target.closest && e.target.closest('.ref-biblica');
				if (el) mostrar(el);
			});
			document.addEventListener('mouseout', function (e) {
				if (e.target.closest && e.target.closest('.ref-biblica')) ocultar();
			});
			popup.addEventListener('mouseenter', function () { clearTimeout(timer); });
			popup.addEventListener('mouseleave', function () { ocultar(); });
		}

		document.addEventListener('click', function (e) {
			var el = e.target.closest && e.target.closest('.ref-biblica');
			if (el) {
				e.preventDefault();
				if (actual === el && popup.classList.contains('visible') && D.soloClick) ocultar(true);
				else mostrar(el);
			} else if (!(e.target.closest && e.target.closest('#popup-versiculo'))) {
				ocultar(true);
			}
		});
		document.addEventListener('keydown', function (e) {
			var el = e.target.classList && e.target.classList.contains('ref-biblica') ? e.target : null;
			if (el && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); mostrar(el); }
			if (e.key === 'Escape') ocultar(true);
		});
		document.addEventListener('focusout', function (e) {
			if (e.target.classList && e.target.classList.contains('ref-biblica')) ocultar();
		});
		window.addEventListener('resize', function () { if (actual) mostrar(actual); });
	}

	/* ------------------------------------------------------------------
	 * Inicio
	 * ---------------------------------------------------------------- */
	function iniciar() {
		var hallazgos = buscar();
		if (!hallazgos.length) return;
		var claves = [];
		hallazgos.forEach(function (h) {
			h.citas.forEach(function (c) { claves = claves.concat(c.claves); });
		});
		obtener(claves).then(function () {
			marcar(hallazgos);
			crearPopup();
		});
	}


	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
	else iniciar();
})();
