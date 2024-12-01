class DynamicPageLoader {
	constructor(config) {
		this.fadeElement = document.querySelector(config.fadeElement);
		this.loadingElement = document.querySelector(config.loadingElement);
		this.linkClass = config.linkClass;

		this.init();
	}

	init() {
		document.addEventListener('click', (e) => {
			const link = e.target.closest(`.${this.linkClass}`);
			if (link) {
				e.preventDefault();
				const url = link.getAttribute('href');
				this.loadPage(url);
			}
		});

		window.addEventListener('popstate', (e) => {
			if (e.state?.url) {
				this.loadPage(e.state.url, false);
			}
		});
	}

	async loadPage(url, pushState = true) {
		try {
			this.showLoading();

			const response = await fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
			if (!response.ok) throw new Error(`Failed to load: ${response.statusText}`);

			const html = await response.text();
			const parser = new DOMParser();
			const doc = parser.parseFromString(html, 'text/html');

			this.updateContent(doc);
			this.updateMeta(doc);
			this.updateTitle(doc);

			if (pushState) {
				history.pushState({ url }, '', url);
			}
		} catch (error) {
			console.error(error);
		} finally {
			this.hideLoading();
		}
	}

	showLoading() {
		this.loadingElement.style.display = 'block';
		this.fadeOut(this.fadeElement);
	}

	hideLoading() {
		this.loadingElement.style.display = 'none';
		this.fadeIn(this.fadeElement);
	}

	updateContent(doc) {
		const newContent = doc.querySelector(this.fadeElement.tagName);
		if (newContent) {
			this.fadeElement.innerHTML = newContent.innerHTML;
			this.reloadScripts(doc);
		}
	}

	reloadScripts(doc) {
		const oldScripts = document.querySelectorAll('script');
		oldScripts.forEach((script) => script.remove());

		const newScripts = doc.querySelectorAll('script');
		newScripts.forEach((script) => {
			const newScript = document.createElement('script');
			newScript.src = script.src;
			newScript.textContent = script.textContent;
			document.body.appendChild(newScript);
		});
	}

	updateMeta(doc) {
		const metaTags = document.querySelectorAll('meta[name="description"], meta[name="keywords"]');
		metaTags.forEach((tag) => tag.remove());

		const newMetaTags = doc.querySelectorAll('meta[name="description"], meta[name="keywords"]');
		newMetaTags.forEach((meta) => {
			document.head.appendChild(meta.cloneNode(true));
		});
	}

	updateTitle(doc) {
		const newTitle = doc.querySelector('title');
		if (newTitle) {
			document.title = newTitle.textContent;
		}
	}

	fadeOut(element) {
		element.style.transition = 'opacity 0.5s';
		element.style.opacity = 0;
		setTimeout(() => (element.style.display = 'none'), 500);
	}

	fadeIn(element) {
		element.style.display = 'block';
		element.style.opacity = 0;
		element.style.transition = 'opacity 0.5s';
		setTimeout(() => (element.style.opacity = 1), 10);
	}
}

// Example usage
//const loader = new DynamicPageLoader({
//	fadeElement: '#content',
//	loadingElement: '#loading',
//	linkClass: 'dynamic-link',
//});
