<script lang="ts">
	import 'carbon-components-svelte/css/g10.css';
	import '@carbon/charts-svelte/styles.css'
	import { SideNav, SideNavItems, SideNavLink } from 'carbon-components-svelte';

	// Track if sidebar is expanded
	let isSideNavExpanded = false;

	// Toggle sidebar state
	function toggleSideNav() {
		isSideNavExpanded = !isSideNavExpanded;
	}
</script>

<div class="app-container">
	<slot></slot>
</div>

<style>
	.app-container {
		display: flex;
		min-height: 100vh;
	}

	:global(body) {
		margin: 0;
		padding: 0;
	}
</style>
