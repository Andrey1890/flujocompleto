const API_URL = window.API_URL || 'http://localhost:5051/api/v1/productos';
const elements = {
  apiUrl: document.querySelector('#api-url'),
  searchForm: document.querySelector('#search-form'),
  productForm: document.querySelector('#product-form'),
  patchForm: document.querySelector('#patch-form'),
  productsBody: document.querySelector('#products-body'),
  catalogSummary: document.querySelector('#catalog-summary'),
  pageSummary: document.querySelector('#page-summary'),
  previousPage: document.querySelector('#previous-page'),
  nextPage: document.querySelector('#next-page'),
  refreshButton: document.querySelector('#refresh-button'),
  responseStatus: document.querySelector('#response-status'),
  responseOutput: document.querySelector('#response-output'),
  editorTitle: document.querySelector('#editor-title'),
  editorDescription: document.querySelector('#editor-description'),
  submitProduct: document.querySelector('#submit-product'),
  cancelEdit: document.querySelector('#cancel-edit'),
  patchField: document.querySelector('#patch-field'),
  patchValue: document.querySelector('#patch-value'),
  patchValueLabel: document.querySelector('#patch-value-label')
};

const state = { currentPage: 1, total: 0, limit: 100, products: [], mode: 'create' };
elements.apiUrl.textContent = API_URL;

function renderResponse(status, data, integrity = null) {
  const successful = status >= 200 && status < 300;
  elements.responseStatus.className = `status-badge ${successful ? 'status-success' : 'status-error'}`;
  elements.responseStatus.textContent = `${status} ${statusText(status)}`;
  elements.responseOutput.replaceChildren();

  const output = { status, data };
  if (integrity) output.headers = { 'X-Product-Integrity': integrity };
  const code = document.createElement('code');
  code.textContent = JSON.stringify(output, null, 2);
  elements.responseOutput.append(code);
}

function statusText(status) {
  const names = { 200: 'OK', 201: 'Created', 204: 'No Content', 400: 'Bad Request', 404: 'Not Found', 409: 'Conflict', 500: 'Server Error' };
  return names[status] || 'HTTP';
}

function renderTransportError(error) {
  elements.responseStatus.className = 'status-badge status-error';
  elements.responseStatus.textContent = 'Sin conexión';
  elements.responseOutput.replaceChildren();
  const code = document.createElement('code');
  code.textContent = JSON.stringify({
    error: 'No se pudo conectar con la API.',
    detail: error.message,
    hint: 'Verifica que el backend esté iniciado en http://localhost:5051.'
  }, null, 2);
  elements.responseOutput.append(code);
}

async function request(url, options = {}) {
  try {
    const response = await fetch(url, options);
    const text = await response.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    renderResponse(response.status, data, response.headers.get('X-Product-Integrity'));
    return { response, data };
  } catch (error) {
    renderTransportError(error);
    throw error;
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function renderProducts() {
  elements.productsBody.replaceChildren();

  if (state.products.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = '<td class="empty-state" colspan="5"><span class="empty-icon" aria-hidden="true">▤</span><strong>No hay productos en esta página</strong><span>Prueba otra página o actualiza el listado.</span></td>';
    elements.productsBody.append(row);
    return;
  }

  for (const product of state.products) {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${escapeHtml(product.idProducto)}</td>
      <td>${escapeHtml(product.proNombre)}</td>
      <td>${escapeHtml(product.proCategoria)}</td>
      <td class="align-right">${formatPrice(product.proPvp)}</td>
      <td><div class="product-actions align-right">
        <button class="table-action" type="button" data-action="edit" title="Cargar para editar" aria-label="Cargar ${escapeHtml(product.idProducto)} para editar">✎</button>
        <button class="table-action delete" type="button" data-action="delete" title="Eliminar producto" aria-label="Eliminar ${escapeHtml(product.idProducto)}">×</button>
      </div></td>`;
    row.querySelector('[data-action="edit"]').addEventListener('click', () => fillEditor(product));
    row.querySelector('[data-action="delete"]').addEventListener('click', () => deleteProduct(product.idProducto));
    elements.productsBody.append(row);
  }
}

function formatPrice(price) {
  const numericPrice = Number(price);
  return Number.isFinite(numericPrice) ? `$${numericPrice.toFixed(2)}` : escapeHtml(price);
}

function updatePagination() {
  const pageCount = Math.max(1, Math.ceil(state.total / state.limit));
  elements.catalogSummary.textContent = `${state.total.toLocaleString('es-CO')} productos · página ${state.currentPage} de ${pageCount}`;
  elements.pageSummary.textContent = `Página ${state.currentPage} · ${state.products.length} de ${state.limit} productos`;
  elements.previousPage.disabled = state.currentPage <= 1;
  elements.nextPage.disabled = state.currentPage >= pageCount;
}

async function loadProducts(page = state.currentPage) {
  const { response, data } = await request(`${API_URL}?page=${page}`);
  if (!response.ok) return;

  state.currentPage = data.page;
  state.total = Number(data.total);
  state.limit = Number(data.limit);
  state.products = Array.isArray(data.data) ? data.data : [];
  renderProducts();
  updatePagination();
}

function fillEditor(product) {
  const form = elements.productForm.elements;
  state.mode = 'update';
  form.mode.value = 'update';
  form.idProducto.value = product.idProducto;
  form.idProducto.readOnly = true;
  form.proNombre.value = product.proNombre;
  form.proCategoria.value = product.proCategoria;
  form.proPvp.value = product.proPvp;
  elements.editorTitle.textContent = 'Editar producto';
  elements.editorDescription.textContent = 'Reemplaza todos sus campos con PUT';
  elements.submitProduct.innerHTML = 'Guardar cambios <span aria-hidden="true">→</span>';
  elements.cancelEdit.hidden = false;
  elements.patchForm.elements.idProducto.value = product.idProducto;
  elements.productForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function resetEditor() {
  state.mode = 'create';
  elements.productForm.reset();
  elements.productForm.elements.mode.value = 'create';
  elements.productForm.elements.idProducto.readOnly = false;
  elements.editorTitle.textContent = 'Crear producto';
  elements.editorDescription.textContent = 'Agrega un producto al catálogo';
  elements.submitProduct.innerHTML = 'Crear producto <span aria-hidden="true">→</span>';
  elements.cancelEdit.hidden = true;
}

function productFromForm(form) {
  const values = new FormData(form);
  return {
    idProducto: values.get('idProducto').trim(),
    proNombre: values.get('proNombre').trim(),
    proCategoria: values.get('proCategoria').trim(),
    proPvp: Number(values.get('proPvp'))
  };
}

elements.searchForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const id = new FormData(elements.searchForm).get('idProducto').trim();
  try {
    const { response, data } = await request(`${API_URL}/${encodeURIComponent(id)}`);
    if (response.ok && data?.data) {
      fillEditor(data.data);
      elements.patchForm.elements.idProducto.value = data.data.idProducto;
    }
  } catch {
    // The request helper already displays transport errors.
  }
});

elements.productForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const product = productFromForm(elements.productForm);
  const isUpdate = state.mode === 'update';
  const method = isUpdate ? 'PUT' : 'POST';
  const url = isUpdate ? `${API_URL}/${encodeURIComponent(product.idProducto)}` : API_URL;

  try {
    const { response } = await request(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    if (response.ok) {
      resetEditor();
      await loadProducts(state.currentPage);
    }
  } catch {
    // The request helper already displays transport errors.
  }
});

elements.patchField.addEventListener('change', () => {
  const field = elements.patchField.value;
  const isPrice = field === 'proPvp';
  elements.patchValueLabel.textContent = `Nuevo ${field === 'proNombre' ? 'nombre' : field === 'proCategoria' ? 'categoría' : 'precio'}`;
  elements.patchValue.type = isPrice ? 'number' : 'text';
  elements.patchValue.min = isPrice ? '0.01' : '';
  elements.patchValue.max = isPrice ? '99999.99' : field === 'proNombre' ? '35' : '12';
  elements.patchValue.step = isPrice ? '0.01' : '';
  elements.patchValue.placeholder = isPrice ? '0.00' : 'Nuevo valor';
});

elements.patchForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const values = new FormData(elements.patchForm);
  const id = values.get('idProducto').trim();
  const field = values.get('field');
  const rawValue = values.get('value');
  const payload = { [field]: field === 'proPvp' ? Number(rawValue) : rawValue.trim() };

  try {
    const { response } = await request(`${API_URL}/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (response.ok) await loadProducts(state.currentPage);
  } catch {
    // The request helper already displays transport errors.
  }
});

async function deleteProduct(id) {
  if (!window.confirm(`¿Eliminar el producto ${id}? Esta acción no se puede deshacer.`)) return;
  try {
    const { response } = await request(`${API_URL}/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (response.ok) await loadProducts(state.currentPage);
  } catch {
    // The request helper already displays transport errors.
  }
}

elements.refreshButton.addEventListener('click', () => loadProducts().catch(() => {}));
elements.previousPage.addEventListener('click', () => loadProducts(state.currentPage - 1).catch(() => {}));
elements.nextPage.addEventListener('click', () => loadProducts(state.currentPage + 1).catch(() => {}));
elements.cancelEdit.addEventListener('click', resetEditor);

loadProducts().catch(() => {});
