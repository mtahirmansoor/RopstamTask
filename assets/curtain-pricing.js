/**
 * Curtain Product Dynamic Pricing
 * Simplified version with clear logic
 */
(function () {
  'use strict';

  // Wait for DOM to load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    // Get all DOM elements
    const widthSelect = document.getElementById('width-select');
    const dropSelect = document.getElementById('drop-select');
    const quantityInput = document.getElementById('quantity');
    const qtyMinus = document.getElementById('qty-minus');
    const qtyPlus = document.getElementById('qty-plus');
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    const curtainForm = document.getElementById('curtain-form');
    const variantIdInput = document.getElementById('variant-id');
    const fabricPanelsInput = document.getElementById('fabric-panels-hidden');
    const dynamicPrice = document.getElementById('dynamic-price');
    const btnPrice = document.getElementById('btn-price');

    // Debug elements
    const debugWidth = document.getElementById('debug-width');
    const debugPanels = document.getElementById('debug-panels');
    const debugDrop = document.getElementById('debug-drop');
    const debugVariant = document.getElementById('debug-variant');
    const debugPrice = document.getElementById('debug-price');

    // Load product data from JSON
    const productDataEl = document.getElementById('product-data');
    if (!productDataEl) {
      console.error('Product data not found!');
      return;
    }

    let productData;
    try {
      productData = JSON.parse(productDataEl.textContent);
    } catch (e) {
      console.error('Failed to parse product data:', e);
      return;
    }

    console.log('Product Data Loaded:', productData);

    // State
    let selectedWidth = null;
    let selectedDrop = null;
    let calculatedPanels = null;
    let selectedVariant = null;

    // Event Listeners
    if (widthSelect) widthSelect.addEventListener('change', handleWidthChange);
    if (dropSelect) dropSelect.addEventListener('change', handleDropChange);
    if (quantityInput) quantityInput.addEventListener('change', updatePrice);
    if (qtyMinus) qtyMinus.addEventListener('click', () => changeQuantity(-1));
    if (qtyPlus) qtyPlus.addEventListener('click', () => changeQuantity(1));
    if (curtainForm) curtainForm.addEventListener('submit', handleSubmit);

    /** ------------------------------
     * Handle Width Change
     * ----------------------------- */
    function handleWidthChange(e) {
      selectedWidth = e.target.value;
      console.log('Width selected:', selectedWidth);

      if (!selectedWidth) {
        resetState();
        return;
      }

      // Calculate fabric panels needed
      calculatedPanels = calculateFabricPanels(selectedWidth);
      console.log('Calculated panels:', calculatedPanels);

      if (fabricPanelsInput) {
        fabricPanelsInput.value = calculatedPanels;
      }

      updateDebug();

      if (selectedDrop) {
        findAndSelectVariant();
      }
    }

    /** ------------------------------
     * Handle Drop Change
     * ----------------------------- */
    function handleDropChange(e) {
      selectedDrop = e.target.value;
      console.log('Drop selected:', selectedDrop);

      if (!selectedDrop) {
        disableButton();
        return;
      }

      updateDebug();

      if (selectedWidth && calculatedPanels) {
        findAndSelectVariant();
      }
    }

    /** ------------------------------
     * Calculate Fabric Panels
     * ----------------------------- */
    function calculateFabricPanels(width) {
      const widthNum = parseFloat(width);

      // Try metafield mapping first
      if (productData.fabricPanelMapping && productData.fabricPanelMapping[width]) {
        return productData.fabricPanelMapping[width];
      }

      // Fallback: 1 panel per 100cm
      return Math.max(1, Math.ceil(widthNum / 100));
    }

    /** ------------------------------
     * Find and Select Variant
     * ----------------------------- */
    function findAndSelectVariant() {
      console.log('Finding variant for:', {
        panels: calculatedPanels,
        drop: selectedDrop
      });

      const patterns = [
        `${calculatedPanels} Panel`,
        `${calculatedPanels} Panels`,
        `${calculatedPanels}Panel`,
        `${calculatedPanels}Panels`,
        calculatedPanels.toString()
      ];

      selectedVariant = null;

      for (let pattern of patterns) {
        selectedVariant = productData.variants.find(v => {
          const dropMatch = v.option1 && v.option1.trim().toLowerCase() === selectedDrop.trim().toLowerCase();
          const panelMatch = v.option2 && v.option2.toLowerCase().includes(pattern.toLowerCase());
          return dropMatch && panelMatch;
        });

        if (selectedVariant) {
          console.log('✅ Variant found with pattern:', pattern, selectedVariant);
          break;
        }
      }

      if (!selectedVariant) {
        console.warn('⚠️ No matching variant found!');
        alert('No matching variant found. Please check product setup.');
        disableButton();
        return;
      }

      if (variantIdInput) {
        variantIdInput.value = selectedVariant.id;
      }

      updatePrice();
      enableButton();
      updateDebug();
    }

    /** ------------------------------
     * Update Price Display
     * ----------------------------- */
    function updatePrice() {
      if (!selectedVariant) return;

      const qty = parseInt(quantityInput.value) || 1;
      const totalPrice = selectedVariant.price * qty;
      const formatted = formatMoney(totalPrice);

      if (dynamicPrice) dynamicPrice.textContent = formatted;
      if (btnPrice) btnPrice.textContent = formatted;

      updateDebug();
    }

    function formatMoney(cents) {
      const dollars = cents / 100;
      return 'Rs.' + dollars.toFixed(2);
    }

    function changeQuantity(delta) {
      const current = parseInt(quantityInput.value) || 1;
      const newQty = Math.max(1, current + delta);
      quantityInput.value = newQty;
      updatePrice();
    }

    function enableButton() {
      if (addToCartBtn) addToCartBtn.disabled = false;
    }

    function disableButton() {
      if (addToCartBtn) addToCartBtn.disabled = true;
      if (btnPrice) btnPrice.textContent = '';
    }

    function resetState() {
      selectedWidth = null;
      calculatedPanels = null;
      selectedVariant = null;
      disableButton();
      updateDebug();
    }

    function updateDebug() {
      if (debugWidth) debugWidth.textContent = selectedWidth ? selectedWidth + 'cm' : '-';
      if (debugPanels) debugPanels.textContent = calculatedPanels || '-';
      if (debugDrop) debugDrop.textContent = selectedDrop || '-';
      if (debugVariant) debugVariant.textContent = selectedVariant ? selectedVariant.id : '-';
      if (debugPrice) debugPrice.textContent = selectedVariant ? formatMoney(selectedVariant.price) : '-';
    }

    /** ------------------------------
     * Handle Form Submit
     * ----------------------------- */
    function handleSubmit(e) {
      e.preventDefault();

      if (!selectedWidth || !selectedDrop || !selectedVariant) {
        alert('Please select both Width and Drop');
        return;
      }

      const variantId = selectedVariant.id;
      const quantity = parseInt(quantityInput.value) || 1;

      console.log('Adding to cart:', {
        variantId,
        quantity,
        properties: {
          Width: selectedWidth + 'cm',
          Drop: selectedDrop,
          'Fabric Panels': calculatedPanels
        }
      });

      addToCart(variantId, quantity);
    }

    /** ------------------------------
     * Add to Cart via AJAX
     * ----------------------------- */
    async function addToCart(variantId, quantity = 1) {
      try {
        const response = await fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: variantId, quantity })
        });

        if (!response.ok) throw new Error('Failed to add to cart');

        await animateCartCount();
        await openCartDrawer();

      } catch (error) {
        console.error('Add to cart failed:', error);
        alert('Sorry, failed to add this product to cart.');
      }
    }

    /** ------------------------------
     * Animate & Update Cart Count
     * ----------------------------- */
    async function animateCartCount() {
      try {
        console.log('🟢 animateCartCount() triggered');
        const res = await fetch('/cart.js');
        const cart = await res.json();

        console.log('🛒 Cart fetched:', cart);
        const count = cart.item_count || 0;

        let countBubble = document.querySelector('.cart-count-bubble');
        const cartIcon = document.querySelector('#cart-icon-bubble');

        if (!countBubble && cartIcon) {
          console.log('🪄 Creating missing cart-count-bubble element...');
          countBubble = document.createElement('div');
          countBubble.className = 'cart-count-bubble';
          countBubble.innerHTML = `<span aria-hidden="true">0</span>`;
          cartIcon.appendChild(countBubble);
        }

        const countSpan = countBubble?.querySelector('span[aria-hidden="true"]');
        if (!countSpan) return;

        let current = parseInt(countSpan.textContent) || 0;
        const target = count;
        const step = Math.sign(target - current);
        if (step === 0) return;

        const interval = setInterval(() => {
          current += step;
          countSpan.textContent = current;
          if (current === target) clearInterval(interval);
        }, 50);

        document.dispatchEvent(new CustomEvent('cart:updated', { detail: cart }));

      } catch (err) {
        console.error('❌ Failed to update cart count:', err);
      }
    }

    /** ------------------------------
     * Open Cart Drawer
     * ----------------------------- */
    async function openCartDrawer() {
      const cartDrawer = document.querySelector('cart-drawer');
      if (!cartDrawer) return;

      try {
        const response = await fetch(`${routes.cart_url}?section_id=cart-drawer`);
        const html = await response.text();
        const newDrawer = new DOMParser().parseFromString(html, 'text/html').querySelector('cart-drawer');

        if (newDrawer) cartDrawer.replaceWith(newDrawer);

        const drawerElement = document.querySelector('cart-drawer');
        drawerElement.classList.add('active');
        drawerElement.open = true;

      } catch (err) {
        console.error('Failed to open cart drawer:', err);
      }
    }
  }
})();
