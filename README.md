# DynamicPageLoader
Vanilla Javascript to dynamically load pages without refreshing

## Info
The `<title>`, `<meta[name="description"]`, and `<meta[name="keywords"]` atributes will be grabbed from the page we're loading from and added to the page we're on.
The back button will work as expected.
> [!NOTE]
> Ensure your page you're loading has the same id element that you define for `fadeElement` value. When the page is grabbed this class finds the same id element name and loaded it into that id on the page that is loaded already.

## Initalizing 
```js
const loader = new DynamicPageLoader({
	fadeElement: '#content', // the element that gets updated. This ID needs to be in the current page, and the page thats being loaded or nothing will show.
	loadingElement: '#loading', // the loader icon
	linkClass: 'dynamic-link', // when a link has this class name it will load dynamically when clicked.
	dontReload: [ // do reload these javascript files
		'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js',
		window.location.origin+'/assets/js/global.js',
	],
	dontReloadCSS: [ // dont reload these css files
		'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
		window.location.origin+'/assets/css/global.css',
	],
	dontReloadPreload: [ // dont reload these reloaded files
		window.location.origin+'/assets/fonts/Redressed/Redressed-3X6y.woff2',
		window.location.origin+'/assets/fonts/Redressed/Redressed-3X6y.woff',
		window.location.origin+'/assets/fonts/Redressed/Redressed-3X6y.ttf',
	]
});
```

## Load Page
```js
loader.loadPage('/some-other-page.html');
```
