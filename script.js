document.addEventListener('DOMContentLoaded', () => {
	/* --- Header glass effect on scroll --- */
	const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
	const doc = document.documentElement;
	const RANGE = 220;
	function updateGlass(){
		const y = window.scrollY || 0;
		const r = clamp(y / RANGE, 0, 1);
		const headerOpacity = (0.6 + 0.38 * r).toFixed(3);
		doc.style.setProperty('--header-opacity', headerOpacity);
	}
	updateGlass();
	let scheduled = false;
	window.addEventListener('scroll', () => {
		if(!scheduled){ scheduled = true; requestAnimationFrame(()=>{ updateGlass(); scheduled = false; }); }
	}, { passive:true });

	/* --- Card scaling (pointer influence) --- */
	const viewport = document.querySelector('.projects-viewport');
	const cards = Array.from(document.querySelectorAll('.project-card'));
	if(viewport && cards.length){
		const MAX_SCALE = 1.16;
		const MIN_SCALE = 1.00;
		const INFLUENCE = 420;
		let rects = [];
		function updateRects(){ rects = cards.map(c => c.getBoundingClientRect()); }
		updateRects();
		window.addEventListener('resize', updateRects, { passive:true });
		window.addEventListener('scroll', updateRects, { passive:true });

		let rafPending = false;
		let pointer = { x: 0, y: 0 };
		function applyTransforms(){
			for(let i = 0; i < cards.length; i++){
				const card = cards[i];
				const rect = rects[i];
				const cx = rect.left + rect.width/2;
				const cy = rect.top + rect.height/2;
				const dx = pointer.x - cx;
				const dy = pointer.y - cy;
				const dist = Math.hypot(dx, dy);
				const t = Math.max(0, 1 - Math.min(dist / INFLUENCE, 1));
				const scale = MIN_SCALE + (MAX_SCALE - MIN_SCALE) * t;
				const blur = 10 + 30 * t;
				const yOff = 8 + 20 * t;
				const alpha = 0.08 + 0.22 * t;
				card.style.transform = `scale(${scale})`;
				card.style.boxShadow = `0 ${yOff.toFixed(1)}px ${blur.toFixed(1)}px rgba(0,0,0,${alpha.toFixed(3)})`;
			}
			rafPending = false;
		}

		function onPointerMove(e){
			const p = (e.touches && e.touches[0]) ? e.touches[0] : e;
			pointer.x = p.clientX; pointer.y = p.clientY;
			if(!rafPending){ rafPending = true; requestAnimationFrame(applyTransforms); }
		}

		function resetTransforms(){ cards.forEach(c => { c.style.transform = ''; c.style.boxShadow = ''; }); }

		viewport.addEventListener('pointermove', onPointerMove, { passive:true });
		viewport.addEventListener('pointerleave', resetTransforms);
		viewport.addEventListener('touchend', resetTransforms);
		cards.forEach(card => {
			card.addEventListener('focus', () => {
				card.style.transform = `scale(${MAX_SCALE})`;
				card.style.boxShadow = `0 28px 40px rgba(0,0,0,0.28)`;
			});
			card.addEventListener('blur', () => { card.style.transform = ''; card.style.boxShadow = ''; });
		});
	}

	/* --- Mobile nav toggle --- */
	const btn = document.querySelector('.nav-toggle');
	const navList = document.querySelector('.main-nav .nav-list');
	if(btn && navList){
		function setOpen(open){ btn.setAttribute('aria-expanded', String(!!open)); if(open) navList.setAttribute('data-open', 'true'); else navList.removeAttribute('data-open'); }
		btn.addEventListener('click', () => { const isOpen = btn.getAttribute('aria-expanded') === 'true'; setOpen(!isOpen); });
		document.addEventListener('click', (e) => { if(!navList.hasAttribute('data-open')) return; if(e.target === btn || navList.contains(e.target)) return; setOpen(false); });
		window.addEventListener('resize', () => { if(window.innerWidth >= 520) setOpen(false); });
	}
});

// Hero entrance, per-word stagger and parallax + reveal-on-scroll
document.addEventListener('DOMContentLoaded', () => {
	const hero = document.querySelector('.hero--sananes');
	if(hero){
		const title = hero.querySelector('.hero-copy h1') || hero.querySelector('h1');
		if(title){
			const words = title.textContent.trim().split(/\s+/);
			title.textContent = '';
			words.forEach((w,i) => {
				const span = document.createElement('span');
				span.className = 'word';
				span.textContent = w + (i < words.length - 1 ? ' ' : '');
				span.style.transitionDelay = (i * 70) + 'ms';
				title.appendChild(span);
			});
		}
		requestAnimationFrame(()=> setTimeout(()=> hero.classList.add('is-active'), 120));
		const media = hero.querySelector('.hero-media');
		const kit = hero.querySelector('.kit');
		const fdisp = document.getElementById('fdisp');
		const fturb = document.getElementById('fturb');
		if(kit){
			kit.addEventListener('focus', ()=>{
				kit.classList.add('is-dragging');
				if(fdisp) fdisp.setAttribute('scale', '12');
				if(fturb) fturb.setAttribute('baseFrequency', '0.02');
				kit.style.transform = 'scale(1.04) translateY(-6px)';
			});
			kit.addEventListener('blur', ()=>{
				kit.classList.remove('is-dragging');
				if(fdisp) fdisp.setAttribute('scale', '0');
				if(fturb) fturb.setAttribute('baseFrequency', '0');
				kit.style.transform = '';
			});
		}
		if(media){
			const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
			hero.addEventListener('pointermove', (e)=>{
				const rect = hero.getBoundingClientRect();
				const px = (e.clientX - rect.left) / rect.width;
				const py = (e.clientY - rect.top) / rect.height;
				const mx = px - 0.5;
				const my = py - 0.5;
				media.style.transform = `translate(${clamp(mx * 18, -22, 22)}px, ${clamp(my * 10, -18, 18)}px)`;
				if(kit){
					const krect = kit.getBoundingClientRect();
					const kx = (e.clientX - krect.left) / krect.width;
					const ky = (e.clientY - krect.top) / krect.height;
					const dx = (kx - 0.5) * 40;
					const dy = (ky - 0.5) * 40;
					const sx = 1 + Math.abs(dx) / 220;
					const sy = 1 + Math.abs(dy) / 220;
					kit.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
					kit.classList.add('is-dragging');
					const speed = Math.min(60, Math.hypot(dx, dy));
					const fdisp = document.getElementById('fdisp');
					const fturb = document.getElementById('fturb');
					if(fdisp) fdisp.setAttribute('scale', String(4 + speed * 0.8));
					if(fturb) fturb.setAttribute('baseFrequency', String(0.01 + speed * 0.0008));
				}
			});
			hero.addEventListener('pointerleave', ()=>{ media.style.transform = ''; if(kit){ kit.style.transform = ''; kit.classList.remove('is-dragging'); const fdisp = document.getElementById('fdisp'); const fturb = document.getElementById('fturb'); if(fdisp) fdisp.setAttribute('scale','0'); if(fturb) fturb.setAttribute('baseFrequency','0'); } });
		}
	}

	const obs = new IntersectionObserver((entries)=>{
		entries.forEach(entry=>{
			if(entry.isIntersecting){
				const el = entry.target;
				if(el.classList.contains('projects-grid')){
					const items = Array.from(el.children);
					items.forEach((it, idx)=> setTimeout(()=> it.classList.add('is-revealed'), idx * 90));
				} else {
					el.classList.add('is-revealed');
				}
				obs.unobserve(el);
			}
		});
	}, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
	document.querySelectorAll('.projects-grid, .section--split, .project-card').forEach(el => obs.observe(el));
});
