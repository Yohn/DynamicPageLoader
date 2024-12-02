class DynamicPageLoader {
	constructor(config) {
		this.fadeElementSelector = config.fadeElement; // Store the selector
		this.fadeElement = document.querySelector(config.fadeElement);
		this.loadingElement = document.querySelector(config.loadingElement);
		this.linkClass = config.linkClass;
		this.dontReload = config.dontReload || [];
		this.dontReloadCSS = config.dontReloadCSS || [];
		this.dontReloadPreload = config.dontReloadPreload || []; // Add dontReloadPreload option

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
			//console.log(html);  // Debug: Check the page content

			// Start fade out and wait for it to complete
			await this.fadeOut(this.fadeElement);
			
			this.updateStyles(doc); // Update stylesheets
			this.updateContent(doc);  // Update page content
			this.updateMeta(doc);     // Update meta tags
			this.updateTitle(doc);    // Update the title

			if (pushState) {
				history.pushState({ url }, '', url);
			}
		} catch (error) {
			console.error(error);
		} finally {
			this.hideLoading();
		}
	}

	updateContent(doc) {
		// Get the content from the loaded document using the stored selector
		const newContent = doc.querySelector(this.fadeElementSelector);
		console.log('New content:', newContent);  // Debug: Ensure this is not null
		if (newContent) {
			this.fadeElement.innerHTML = newContent.innerHTML;
			this.reloadScripts(doc);
			// Fade in after content is updated
			this.fadeIn(this.fadeElement);
		} else {
			console.error('No content found to replace. Selector:', this.fadeElementSelector);
		}
	}

	showLoading() {
		this.loadingElement.style.display = 'block';
	}

	hideLoading() {
		this.loadingElement.style.display = 'none';
	}

	updateStyles(doc) {
		// Remove old stylesheets that are not present in the new document
		const existingLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
		const newLinks = Array.from(doc.querySelectorAll('link[rel="stylesheet"]'));

		// Get URLs of the new stylesheets
		const newLinkHrefs = newLinks.map(link => link.href);

		// Remove old links that are not in the new document and not in dontReloadCSS
		existingLinks.forEach(link => {
			if (!newLinkHrefs.includes(link.href) && !this.dontReloadCSS.includes(link.href)) {
				link.remove();
			}
		});

		// Add new stylesheets that are not already in the current document
		newLinks.forEach(link => {
			if (!existingLinks.some(existingLink => existingLink.href === link.href)) {
				const newLink = document.createElement('link');
				newLink.rel = 'stylesheet';
				newLink.href = link.href;
				document.head.appendChild(newLink);
			}
		});

		// Handle preload links
		const existingPreloads = Array.from(document.querySelectorAll('link[rel="preload"]'));
		const newPreloads = Array.from(doc.querySelectorAll('link[rel="preload"]'));

		// Get URLs of the new preload links
		const newPreloadHrefs = newPreloads.map(link => link.href);

		// Remove old preload links that are not in the new document and not in dontReloadPreload
		existingPreloads.forEach(link => {
			if (!newPreloadHrefs.includes(link.href) && !this.dontReloadPreload.includes(link.href)) {
				link.remove();
			}
		});

		// Add new preload links that are not already in the current document
		newPreloads.forEach(link => {
			if (!existingPreloads.some(existingLink => existingLink.href === link.href)) {
				const newLink = document.createElement('link');
				newLink.rel = 'preload';
				newLink.href = link.href;
				newLink.as = link.as;
				newLink.type = link.type;
				if (link.crossOrigin) newLink.crossOrigin = link.crossOrigin;
				document.head.appendChild(newLink);
			}
		});
	}

	reloadScripts(doc) {
		const loadedScripts = Array.from(document.querySelectorAll('script')).map((script) => script.src);

		// Ensure `dontReload` scripts are loaded if not already present
		this.dontReload.forEach((url) => {
			if (!loadedScripts.includes(url)) {
				const newScript = document.createElement('script');
				newScript.src = url;
				newScript.async = false; // Adjust as necessary
				document.body.appendChild(newScript);
			}
		});

		// Remove old scripts not in `dontReload`
		const oldScripts = document.querySelectorAll('script');
		oldScripts.forEach((script) => {
			if (!this.dontReload.includes(script.src)) {
				script.remove();
			}
		});

		// Add new scripts from the document
		const newScripts = doc.querySelectorAll('script');
		newScripts.forEach((script) => {
			if (script.src) {
				// Skip loading scripts already in `dontReload`
				if (!this.dontReload.includes(script.src)) {
					const newScript = document.createElement('script');
					newScript.src = script.src;
					newScript.async = script.async || false; // Preserve async attribute if present
					document.body.appendChild(newScript);
				}
			} else {
				// Always append inline scripts
				const newScript = document.createElement('script');
				newScript.textContent = script.textContent;
				document.body.appendChild(newScript);
			}
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
		return new Promise(resolve => {
			element.style.transition = 'opacity 0.5s';
			element.style.opacity = 0;
			// Wait for transition to complete
			setTimeout(resolve, 500);
		});
	}

	fadeIn(element) {
		element.style.transition = 'opacity 0.5s';
		element.style.opacity = 1;
	}
}

// Example usage
//const loader = new DynamicPageLoader({
//	fadeElement: '#content',
//	loadingElement: '#loading',
//	linkClass: 'dynamic-link',
//});
