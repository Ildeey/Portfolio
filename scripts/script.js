document.addEventListener('DOMContentLoaded', () => {
	/* --- Динамический эффект "стекла" для хедера при скролле --- */
	{
		const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
		const doc = document.documentElement;
		const RANGE = 220; // расстояние прокрутки, при котором эффект достигает максимума

		function updateGlass(){
			const y = window.scrollY || window.pageYOffset || 0;
			const r = clamp(y / RANGE, 0, 1);
			const headerOpacity = (0.6 + 0.38 * r).toFixed(3); // от ~0.60 до ~0.98
			const blur = (8 + 6 * r).toFixed(1) + 'px'; // от 8px до 14px
			doc.style.setProperty('--header-opacity', headerOpacity);
			doc.style.setProperty('--glass-blur', blur);
		}

		updateGlass();
		let scheduled = false;
		window.addEventListener('scroll', () => {
			if(!scheduled){
				scheduled = true;
				requestAnimationFrame(()=> { updateGlass(); scheduled = false; });
			}
		}, { passive:true });
	}

	/* --- Масштабирование карточек в зависимости от положения курсора --- */
	{
		const viewport = document.querySelector('.projects-viewport');
		const cards = Array.from(document.querySelectorAll('.project-card'));
		if(!viewport || cards.length === 0) return;

		// параметры эффекта
		const MAX_SCALE = 1.18;
		const MIN_SCALE = 1.00;
		const INFLUENCE = 420; // радиус влияния курсора в px

		let rects = [];
		function updateRects(){
			rects = cards.map(c => c.getBoundingClientRect());
		}
		updateRects();

		// обновляем rects при изменении размера или прокрутке страницы
		window.addEventListener('resize', updateRects, { passive:true });
		window.addEventListener('scroll', updateRects, { passive:true });

		let rafPending = false;
		let pointer = { x: 0, y: 0 };

		function applyTransforms(){
			for(let i = 0; i < cards.length; i++){
				const card = cards[i];
				const rect = rects[i];
				const cx = rect.left + rect.width / 2;
				const cy = rect.top + rect.height / 2;
				const dx = pointer.x - cx;
				const dy = pointer.y - cy;
				const dist = Math.hypot(dx, dy);
				const t = Math.max(0, 1 - Math.min(dist / INFLUENCE, 1)); // 0..1
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
			pointer.x = p.clientX;
			pointer.y = p.clientY;
			if(!rafPending){
				rafPending = true;
				requestAnimationFrame(applyTransforms);
			}
		}

		function resetTransforms(){
			cards.forEach(c => {
				c.style.transform = '';
				c.style.boxShadow = '';
			});
		}

		// Используем pointer-события (работают для мыши и тача)
		viewport.addEventListener('pointermove', onPointerMove, { passive:true });
		viewport.addEventListener('pointerleave', resetTransforms);
		viewport.addEventListener('touchend', resetTransforms);

		// Клавиатурная доступность: фокус даёт максимальный масштаб
		cards.forEach(card => {
			card.addEventListener('focus', () => {
				card.style.transform = `scale(${MAX_SCALE})`;
				card.style.boxShadow = `0 ${ (8 + 20).toFixed(1) }px ${ (10 + 30).toFixed(1) }px rgba(0,0,0,0.28)`;
			});
			card.addEventListener('blur', () => {
				card.style.transform = '';
				card.style.boxShadow = '';
			});
		});
	}

	/* --- Примечание:
	   Модалка удалена: карточки сами открывают отдельные страницы через href.
	   Если нужно — можно добавить автопрокрутку в центр выбранной карточки при фокусе. */
});
