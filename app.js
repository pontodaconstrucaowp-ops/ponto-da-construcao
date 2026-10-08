const SUPABASE_URL = 'https://ifcdfydbkrpdcbtiqysc.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_InDtslnIkU5kvL0-OtzH7g_51jxEKwh';

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const state={
  page:'home',
  user:null,
  cart:[],
  selectedClient:null,
  saleDiscount:0,
  cartOpen:false,
  products:[
    {id:1,name:'Cimento Poty',unit:'saco',price:42.00,stock:120},
    {id:2,name:'Areia',unit:'m³',price:160.00,stock:18},
    {id:3,name:'Seixo',unit:'m³',price:190.00,stock:11},
    {id:4,name:'Tijolo',unit:'milheiro',price:850.00,stock:7},
    {id:5,name:'Madeira',unit:'unidade',price:35.00,stock:95}
  ],
  clients:[
    {id:1,name:'Cliente de demonstração',phone:'(91) 99999-9999',city:'Marituba'}
  ],
  deliveries:[
    {id:1,client:'Cliente de demonstração',address:'Endereço de demonstração',value:1250,priority:'urgente',status:'pending'},
    {id:2,client:'Obra Centro',address:'Rua Principal, 100',value:680,priority:'alta',status:'route'}
  ]
};

async function login(){
  const user=document.getElementById('loginUser').value.trim();
  const pass=document.getElementById('loginPass').value.trim();

  if(!user||!pass){
    alert('Informe e-mail e senha.');
    return;
  }

  const {data,error}=await supabaseClient.auth.signInWithPassword({
    email:user,
    password:pass
  });

  if(error){
    alert('E-mail ou senha incorretos.');
    return;
  }

  const {data:usuario,error:usuarioError}=await supabaseClient
    .from('usuarios')
    .select('*')
    .eq('id',data.user.id)
    .single();

  if(usuarioError||!usuario){
    await supabaseClient.auth.signOut();
    alert('Usuário não cadastrado no sistema.');
    return;
  }

  if(!usuario.ativo){
    await supabaseClient.auth.signOut();
    alert('Este usuário está inativo.');
    return;
  }

  state.user=usuario;

  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  document.getElementById('loggedUser').textContent=usuario.nome;

  if(usuario.tipo==='entregador'){
    navigate('deliveries');
  }else{
    navigate('home');
  }
}
function logout(){
  state.user=null;
  document.getElementById('app').classList.add('hidden');
  document.getElementById('loginScreen').classList.remove('hidden');
}
function toggleUserMenu(){document.getElementById('userMenu').classList.toggle('hidden')}
function navigate(page){
  if(state.user && state.user.tipo === 'entregador'){
  const permitidas = ['deliveries'];

  if(!permitidas.includes(page)){
    page = 'deliveries';
  }
}
  state.page=page;
  document.querySelectorAll('.bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.page===page));
  const titles={home:'Início',sales:'Nova venda',products:'Estoque',deliveries:'Entregas',more:'Mais opções',clients:'Clientes',cash:'Caixa',reports:'Relatórios',settings:'Configurações'};
  document.getElementById('pageTitle').textContent=titles[page]||'Ponto da Construção';
  const content=document.getElementById('content');
  if(page==='home') renderHome(content);
  else if(page==='sales') renderSales(content);
  else if(page==='products') renderProducts(content);
  else if(page==='deliveries') renderDeliveries(content);
  else if(page==='more') renderMore(content);
  else if(page==='clients') renderClients(content);
  else if(page==='cash') renderCash(content);
  else if(page==='reports') renderReports(content);
  else if(page==='settings') renderSettings(content);
  window.scrollTo({top:0,behavior:'smooth'});
}
function money(v){return v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
function logout(){
  state.user=null;
  document.getElementById('app').classList.add('hidden');
  document.getElementById('loginScreen').classList.remove('hidden');
}

function toggleUserMenu(){
  document.getElementById('userMenu').classList.toggle('hidden');
}

function navigate(page){

  if(state.user && state.user.tipo === 'entregador'){

    const permitidas = ['deliveries'];

    if(!permitidas.includes(page)){
      page = 'deliveries';
    }
  }

  state.page=page;

  document
    .querySelectorAll('.bottom-nav button')
    .forEach(b =>
      b.classList.toggle(
        'active',
        b.dataset.page===page
      )
    );

  const titles={
    home:'Início',
    sales:'Nova venda',
    products:'Estoque',
    deliveries:'Entregas',
    more:'Mais opções',
    clients:'Clientes',
    cash:'Caixa',
    reports:'Relatórios',
    settings:'Configurações'
  };

  document.getElementById('pageTitle').textContent =
    titles[page] || 'Ponto da Construção';

  const content =
    document.getElementById('content');

  if(page==='home') renderHome(content);
  else if(page==='sales') renderSales(content);
  else if(page==='products') renderProducts(content);
  else if(page==='deliveries') renderDeliveries(content);
  else if(page==='more') renderMore(content);
  else if(page==='clients') renderClients(content);
  else if(page==='cash') renderCash(content);
  else if(page==='reports') renderReports(content);
  else if(page==='settings') renderSettings(content);

  window.scrollTo({
    top:0,
    behavior:'smooth'
  });
}

window.login = login;
window.logout = logout;
window.toggleUserMenu = toggleUserMenu;
window.navigate = navigate;

function money(v){
  return v.toLocaleString(
    'pt-BR',
    {
      style:'currency',
      currency:'BRL'
    }
  );
}

function renderHome(el){

  el.innerHTML=`
    <div class="grid stats">
      <div class="card stat"><div class="label">Vendas hoje</div><div class="value">${money(3250)}</div></div>
      <div class="card stat"><div class="label">Receber</div><div class="value">${money(1840)}</div></div>
      <div class="card stat"><div class="label">Entregas hoje</div><div class="value">${state.deliveries.length}</div></div>
      <div class="card stat"><div class="label">Estoque baixo</div><div class="value">${state.products.filter(p=>p.stock<10).length}</div></div>
    </div>
    <div class="section-title"><h2>Ações rápidas</h2></div>
    <div class="grid quick">
      <button onclick="navigate('sales')"><strong>＋ Nova venda</strong><span class="muted">Registrar um pedido</span></button>
      <button onclick="navigate('clients')"><strong>👤 Clientes</strong><span class="muted">Cadastrar e consultar</span></button>
      <button onclick="navigate('deliveries')"><strong>⇢ Entregas</strong><span class="muted">Organizar a fila</span></button>
      <button onclick="navigate('products')"><strong>▦ Estoque</strong><span class="muted">Produtos e preços</span></button>
    </div>
    <div class="section-title"><h2>Próximas entregas</h2><button class="secondary" onclick="navigate('deliveries')">Ver todas</button></div>
    <div class="list">${state.deliveries.slice(0,3).map(deliveryCard).join('')}</div>
  `;
}
function deliveryCard(d){
  return `<div class="card"><div class="row"><strong>#${d.id} · ${d.client}</strong><span class="badge ${d.priority}">${d.priority}</span></div><p class="muted">${d.address}</p><div class="row"><span>${money(d.value)}</span><span class="badge ${d.status}">${statusName(d.status)}</span></div></div>`
}
function statusName(s){return s==='pending'?'Pendente':s==='route'?'Em rota':'Entregue'}
async function renderSales(el) {
  el.innerHTML = `
    <div class="card">
      <h2>Cliente</h2>

      <input
        id="saleClient"
        class="search"
        placeholder="Nome ou telefone"
        oninput="searchSaleClients()"
      >

      <div id="saleClientResults"></div>
    </div>

    <div class="section-title">
      <h2>Materiais</h2>
    </div>

    <div id="saleProducts">
      <input
        id="saleProductSearch"
        class="search"
        placeholder="Pesquisar material..."
        oninput="pcMostrarProdutos()"
      >

      <div id="saleProductItems">
        Carregando materiais...
      </div>
    </div>

    <div class="sale-cart">
      <strong>🛒 Resumo do pedido</strong>

      <div id="pcResumoItens"></div>

      <div class="field">
        <label for="saleDiscount">Desconto em reais</label>

        <input
          id="saleDiscount"
          type="number"
          min="0"
          step="0.01"
          value="${Number(state.saleDiscount) || 0}"
          oninput="pcAtualizarResumo()"
        >
      </div>

      <div class="row">
        <strong>Total final</strong>
        <strong id="pcTotalFinal" class="total"></strong>
      </div>

      <div class="actions">
        <button
          class="primary"
          id="pcContinuar"
          onclick="finishSale()"
        >
          Continuar
        </button>

        <button
          class="danger"
          onclick="pcLimparPedido()"
        >
          Limpar pedido
        </button>
      </div>
    </div>
  `;

  if (state.selectedClient) {
    selectSaleClient(state.selectedClient);
  }

  pcAtualizarResumo();

  const lista = el.querySelector('#saleProductItems');

  const { data, error } = await supabaseClient
    .from('produtos')
    .select('*')
    .eq('ativo', true)
    .order('nome', { ascending: true });

  if (!lista.isConnected) return;

  if (error) {
    lista.textContent =
      'Não foi possível carregar: ' + error.message;
    return;
  }

  window.saleProducts = data || [];
  pcMostrarProdutos();
}

function pcEscapar(valor) {
  return String(valor ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

function pcOpcoes(produto) {
  const unidade = String(
    produto.unidade || 'unidade'
  ).trim().toLowerCase();

  const opcoes = [{
    tipo: 'principal',
    unidade,
    preco: Number(produto.preco),
    passo: ['m³', 'kg'].includes(unidade) ? 0.1 : 1
  }];

  if (
    ['dúzia', 'duzia', 'milheiro'].includes(unidade) &&
    produto.preco_avulso != null
  ) {
    opcoes.push({
      tipo: 'avulso',
      unidade: 'unidade',
      preco: Number(produto.preco_avulso),
      passo: 1
    });
  }

  return opcoes;
}

function pcItem(id, tipo) {
  return state.cart.find(item =>
    String(item.id) === String(id) &&
    item.tipoOpcao === tipo
  );
}

function pcSubtotal(item) {
  return Math.round(item.price * item.qty * 100) / 100;
}

function pcTotal() {
  return state.cart.reduce(
    (soma, item) => soma + Math.round(pcSubtotal(item) * 100),
    0
  ) / 100;
}

function pcAgruparMateriais(produtos) {
  const grupos = new Map();

  for (const produto of produtos) {
    const nome = String(produto.nome || '').trim();

    // Retira somente a indicação de unidade no final do nome.
    const nomeBase = nome.replace(
      /\s+[-–—]\s*(dúzia|duzia|unidade|milheiro)\s*$/i,
      ''
    ).trim();

    const chave = nomeBase
      .normalize('NFC')
      .toLocaleUpperCase('pt-BR');

    if (!grupos.has(chave)) {
      grupos.set(chave, {
        nome: nomeBase,
        produtos: []
      });
    }

    grupos.get(chave).produtos.push(produto);
  }

  return [...grupos.values()].flatMap(grupo => {
    const unidade = produto =>
      String(produto.unidade || '').trim().toLowerCase();

    const pacotes = grupo.produtos.filter(produto =>
      ['dúzia', 'duzia', 'milheiro'].includes(
        unidade(produto)
      )
    );

    const avulsos = grupo.produtos.filter(produto =>
      unidade(produto) === 'unidade'
    );

    // Agrupa quando existe exatamente um cadastro de
    // dúzia/milheiro e um cadastro de unidade do mesmo material.
    if (
      grupo.produtos.length === 2 &&
      pacotes.length === 1 &&
      avulsos.length === 1
    ) {
      return [{
        nome: grupo.nome,
        produtos: grupo.produtos,

        opcoes: [pacotes[0], avulsos[0]].map(produto => ({
          ...pcOpcoes(produto)[0],
          id: produto.id
        }))
      }];
    }

    // Produtos sem par continuam aparecendo normalmente.
    // Cadastros ambíguos não são unidos automaticamente.
    return grupo.produtos.map(produto => ({
      nome: produto.nome,
      produtos: [produto],

      opcoes: pcOpcoes(produto).map(opcao => ({
        ...opcao,
        id: produto.id
      }))
    }));
  });
}

function pcMostrarProdutos() {
  const lista = document.getElementById('saleProductItems');
  if (!lista) return;

  const termo = (
    document.getElementById('saleProductSearch')?.value || ''
  ).trim().toLocaleLowerCase('pt-BR');

  // Agrupa antes de pesquisar para manter as duas opções juntas.
  const grupos = pcAgruparMateriais(
    window.saleProducts || []
  ).filter(grupo =>
    [
      grupo.nome,
      ...grupo.produtos.map(produto => produto.nome)
    ].some(nome =>
      String(nome)
        .toLocaleLowerCase('pt-BR')
        .includes(termo)
    )
  );

  lista.innerHTML = grupos.map(grupo => {
    const total = grupo.opcoes.reduce((soma, opcao) => {
      const item = pcItem(opcao.id, opcao.tipo);

      return soma + (
        item ? Math.round(pcSubtotal(item) * 100) : 0
      );
    }, 0) / 100;

    return `
      <div class="card pc-produto">
        <strong>${pcEscapar(grupo.nome)}</strong>

        <div class="pc-opcoes">
          ${grupo.opcoes.map(opcao => {
            const id = Number(opcao.id);

            if (!Number.isSafeInteger(id)) return '';

            const quantidade =
              pcItem(id, opcao.tipo)?.qty || 0;

            const subtotal = Math.round(
              quantidade * opcao.preco * 100
            ) / 100;

            return `
              <div
                class="pc-opcao"
                data-produto="${id}"
                data-tipo="${opcao.tipo}"
              >
                <strong>
                  ${pcEscapar(opcao.unidade)}
                </strong>

                <div class="muted">
                  ${money(opcao.preco)}
                  por ${pcEscapar(opcao.unidade)}
                </div>

                <div class="pc-controles">
                  <button
                    type="button"
                    aria-label="Diminuir ${pcEscapar(opcao.unidade)}"
                    onclick="
                      pcAlterar(${id}, '${opcao.tipo}', -1);
                      pcTotalCartao(this);
                    "
                  >−</button>

                  <input
                    id="pc-q-${id}-${opcao.tipo}"
                    aria-label="Quantidade em ${pcEscapar(opcao.unidade)}"
                    type="number"
                    min="0"
                    step="${opcao.passo}"
                    value="${quantidade}"
                    onchange="
                      pcDefinir(
                        ${id},
                        '${opcao.tipo}',
                        this.value
                      );
                      pcTotalCartao(this);
                    "
                  >

                  <button
                    type="button"
                    aria-label="Adicionar ${pcEscapar(opcao.unidade)}"
                    onclick="
                      pcAlterar(${id}, '${opcao.tipo}', 1);
                      pcTotalCartao(this);
                    "
                  >+</button>
                </div>

                <strong id="pc-s-${id}-${opcao.tipo}">
                  ${money(subtotal)}
                </strong>
              </div>
            `;
          }).join('')}
        </div>

        <div class="pc-total">
          Total do material:
          <strong class="pc-total-material">
            ${money(total)}
          </strong>
        </div>
      </div>
    `;
  }).join('') || `
    <div class="card">Nenhum material encontrado.</div>
  `;
}

function pcTotalCartao(elemento) {
  const cartao = elemento.closest('.pc-produto');
  if (!cartao) return;

  const centavos = [
    ...cartao.querySelectorAll('.pc-opcao')
  ].reduce((soma, opcao) => {
    const item = pcItem(
      opcao.dataset.produto,
      opcao.dataset.tipo
    );

    return soma + (
      item ? Math.round(pcSubtotal(item) * 100) : 0
    );
  }, 0);

  cartao.querySelector('.pc-total-material').textContent =
    money(centavos / 100);
}
function pcAlterar(id, tipo, delta) {
  const produto = (window.saleProducts || []).find(
    p => String(p.id) === String(id)
  );

  const opcao = produto &&
    pcOpcoes(produto).find(o => o.tipo === tipo);

  if (!opcao) return;

  const atual = pcItem(id, tipo)?.qty || 0;

  const nova = Math.max(
    0,
    Math.round((atual + delta * opcao.passo) * 1000) / 1000
  );

  pcDefinir(id, tipo, nova);
}

function pcDefinir(id, tipo, valor) {
  const produto = (window.saleProducts || []).find(
    p => String(p.id) === String(id)
  );

  const opcao = produto &&
    pcOpcoes(produto).find(o => o.tipo === tipo);

  if (!opcao) return;

  const quantidade = Number(
    String(valor).replace(',', '.')
  );

  if (
    !Number.isFinite(quantidade) ||
    quantidade < 0 ||
    (opcao.passo === 1 && !Number.isInteger(quantidade))
  ) {
    alert('Informe uma quantidade válida.');

    const input = document.getElementById(
      `pc-q-${id}-${tipo}`
    );

    if (input) input.value = pcItem(id, tipo)?.qty || 0;
    return;
  }

  const qty = Math.round(quantidade * 1000) / 1000;

  state.cart = state.cart.filter(item =>
    !(
      String(item.id) === String(id) &&
      item.tipoOpcao === tipo
    )
  );

  if (qty > 0) {
    state.cart.push({
      id: produto.id,
      name: produto.nome,
      unit: opcao.unidade,
      price: opcao.preco,
      qty,
      tipoOpcao: tipo
    });
  }

  const input = document.getElementById(
    `pc-q-${id}-${tipo}`
  );

  const subtotal = document.getElementById(
    `pc-s-${id}-${tipo}`
  );

  if (input) input.value = qty;

  if (subtotal) {
    subtotal.textContent = money(
      Math.round(qty * opcao.preco * 100) / 100
    );
  }

  pcAtualizarResumo();
}

function pcAtualizarResumo() {
  const lista = document.getElementById('pcResumoItens');
  if (!lista) return;

  lista.innerHTML = state.cart.map(item => `
    <div class="pc-resumo-linha">
      <strong>${pcEscapar(item.name)}</strong>

      <div>
        ${item.qty.toLocaleString('pt-BR')}
        ${pcEscapar(item.unit)}
        — ${money(pcSubtotal(item))}
      </div>
    </div>
  `).join('') || `
    <p class="muted">
      Escolha as quantidades nos materiais.
    </p>
  `;

  const total = pcTotal();
  const input = document.getElementById('saleDiscount');
  const valor = Number(input.value);

  state.saleDiscount = Math.round(
    Math.min(
      total,
      Math.max(0, Number.isFinite(valor) ? valor : 0)
    ) * 100
  ) / 100;

  document.getElementById('pcTotalFinal').textContent =
    money(total - state.saleDiscount);

  document.getElementById('pcContinuar').disabled =
    !state.cart.length;
}

function pcLimparPedido() {
  state.cart = [];
  state.saleDiscount = 0;

  document.getElementById('saleDiscount').value = 0;

  pcMostrarProdutos();
  pcAtualizarResumo();
}
function openSaleNewClientForm(){

  const results = document.getElementById('saleClientResults');

  if(!results){
    return;
  }

  results.innerHTML = `
    <div class="card">

      <div class="section-title">
        <h3>Novo cliente</h3>
      </div>

      <div style="display:grid;gap:12px">

        <input
          id="newSaleClientName"
          class="search"
          placeholder="Nome do cliente"
        >

        <input
          id="newSaleClientPhone"
          class="search"
          placeholder="Telefone"
        >

        <textarea
          id="newSaleClientAddress"
          class="search"
          placeholder="Endereço"
          rows="3"
        ></textarea>
        <button
  type="button"
  class="secondary"
  onclick="abrirMapaCliente('venda')"
>
  📍 Marcar localização no mapa
</button>

<div
  id="mapaClienteVenda"
  style="
    display:none;
    height:350px;
    width:100%;
    border-radius:12px;
    overflow:hidden;
  "
></div>

<p id="localizacaoClienteVendaStatus" class="muted">
  Nenhuma localização marcada.
</p>

        <div class="actions">

          <button
            type="button"
            class="secondary"
            onclick="clearSaleClient()"
          >
            Cancelar
          </button>

          <button
            type="button"
            class="primary"
            onclick="saveSaleNewClient()"
          >
            Salvar cliente
          </button>

        </div>

      </div>

    </div>
  `;

  const nome = document.getElementById('newSaleClientName');

  if(nome){
    nome.focus();
  }
}

window.openSaleNewClientForm = openSaleNewClientForm;


async function saveSaleNewClient(){
  const { data: { user } } = await supabaseClient.auth.getUser();
  console.log('USUARIO AUTENTICADO:', user);
  
const { data: adminCheck, error: adminCheckError } =
  await supabaseClient.rpc('usuario_e_admin', {
    uid: user.id
  });

  console.log('USUARIO É ADMIN:', adminCheck);
  console.log('ERRO AO VERIFICAR ADMIN:', adminCheckError);
  
  const nome = document.getElementById('newSaleClientName').value.trim();
  const telefone = document.getElementById('newSaleClientPhone').value.trim();
  const endereco = document.getElementById('newSaleClientAddress').value.trim();

  if(!nome){
    alert('Informe o nome do cliente.');
    return;
  }

  if(!telefone){
    alert('Informe o telefone do cliente.');
    return;
  }

  if(!endereco){
    alert('Informe o endereço do cliente.');
    return;
  }

  const { data, error } = await supabaseClient
    .from('clientes')
    .insert({
      nome: nome,
      telefone: telefone,
      endereço: endereco
    })
    .select('id,nome,telefone,endereço')
    .single();

  if(error){
    alert('Não foi possível cadastrar o cliente: ' + error.message);
    return;
  }

  state.selectedClient = data.id;

  const input = document.getElementById('saleClient');

  if(input){
    input.value = data.nome;
    input.disabled = true;
  }

  const results = document.getElementById('saleClientResults');

  if(results){
    results.innerHTML = `
      <div class="card">
        <div class="product-name">${data.nome}</div>

        <div class="muted">
          ${data.telefone}
        </div>

        <div class="muted">
          ${data.endereço}
        </div>

        <div class="badge done" style="margin-top:10px">
          Cliente cadastrado
        </div>

        <button
          class="secondary"
          style="margin-top:10px"
          onclick="clearSaleClient()"
        >
          Trocar cliente
        </button>
      </div>
    `;
  }
}
function filterSaleProducts() {
  const input = document.getElementById('saleProductSearch');

  if (!input) return;

  const termo = input.value
    .trim()
    .toLowerCase();

  const filtrados = window.saleProducts.filter(p =>
    p.nome.toLowerCase().includes(termo)
  );

  renderSaleProductItems(filtrados);
}

function renderSaleProductItems(produtos) {
  const container =
    document.getElementById('saleProductItems');

  if (!container) return;

  if (!produtos || produtos.length === 0) {
    container.innerHTML = `
      <div class="card">
        <strong>NENHUM MATERIAL ENCONTRADO</strong>

        <p class="muted">
          TENTE PESQUISAR POR OUTRO NOME.
        </p>
      </div>
    `;

    return;
  }

  container.innerHTML =
    produtos.map(p => {

      const controlaEstoque =
        p.controla_estoque !== false;

      const nome =
        String(p.nome || '').toUpperCase();

      const unidade =
        String(p.unidade || '').toUpperCase();

      const preco =
        money(Number(p.preco || 0));
let precoAvulso = '';

if(unidade === 'MILHEIRO'){
  precoAvulso =
    money(Number(p.preco || 0) / 1000);
}

if(unidade === 'DÚZIA'){
  precoAvulso =
    money(Number(p.preco || 0) / 12);
}
      return `
        <div class="card">

          <div class="row">

            <div>

              <div class="product-name">
                ${nome}
              </div>

              <div class="muted">

${preco} / ${unidade}

${
  precoAvulso
    ? ` · ${precoAvulso} / unidade`
    : ''
}

·

                ${
                  controlaEstoque
                    ? `ESTOQUE ${p.estoque}`
                    : `🛒 REVENDA`
                }

              </div>

            </div>


          </div>

          <div class="actions">

            <button
              class="secondary"
              onclick="addToCart(${p.id})"
            >
              ADICIONAR
            </button>

          </div>

        </div>
      `;

    }).join('');
}
async function searchSaleClients(){
  const input = document.getElementById('saleClient');
  const results = document.getElementById('saleClientResults');

  if(!input || !results) return;

  const busca = input.value.trim();

  if(busca.length < 2){
    results.innerHTML = `
      <p class="muted">Digite pelo menos 2 caracteres.</p>
    `;
    return;
  }

  results.innerHTML = `
    <div class="card muted">Buscando clientes...</div>
  `;

  const { data, error } = await supabaseClient
    .from('clientes')
    .select('id,nome,telefone,endereço')
    .or(`nome.ilike.%${busca}%,telefone.ilike.%${busca}%`)
    .order('nome', { ascending: true })
    .limit(10);

  if(error){
    results.innerHTML = `
      <div class="card">
        <strong>Erro ao buscar cliente</strong>
        <p class="muted">${error.message}</p>
      </div>
    `;
    return;
  }

 
  if(!data || data.length === 0){
    results.innerHTML = `
      <div class="card">
        <p class="muted">Nenhum cliente encontrado.</p>

        <button class="primary" onclick="openSaleNewClientForm()">
          + Novo cliente
        </button>
      </div>
    `;
    return;
  }

  results.innerHTML = data.map(c => `
    <div class="card">
      <div class="product-name">${c.nome || 'Sem nome'}</div>

      <div class="muted">
        ${c.telefone || 'Sem telefone'}
      </div>

      <div class="muted">
        ${c.endereço || 'Sem endereço'}
      </div>

      <div class="actions">
        <button class="primary" onclick="selectSaleClient('${c.id}')">
          Selecionar
        </button>
      </div>
    </div>
  `).join('');
}

function selectSaleClient(id){
  const input = document.getElementById('saleClient');

  state.selectedClient = id;

  if(input){
    input.disabled = true;
  }

  const results = document.getElementById('saleClientResults');

  if(results){
    results.innerHTML = `
      <div class="card">
        <strong>Cliente selecionado</strong>

        <button
          class="secondary"
          style="margin-top:10px"
          onclick="clearSaleClient()"
        >
          Trocar cliente
        </button>
      </div>
    `;
  }
}

function clearSaleClient(){
  state.selectedClient = null;

  const input = document.getElementById('saleClient');

  if(input){
    input.disabled = false;
    input.value = '';
    input.focus();
  }

  const results = document.getElementById('saleClientResults');

  if(results){
    results.innerHTML = `
      <p class="muted">Digite o nome ou telefone do cliente.</p>
    `;
  }
}
function addToCart(id){

  const found =
    state.cart.find(x => x.id === id);

  if(found){

    const unidade =
      String(found.unit || '').toLowerCase();

    const controlaEstoque =
      found.controlaEstoque !== false;

    if(unidade === 'milheiro'){

      const atual =
        Number(found.milheiroInteiro || 0);

      const novo =
        atual + 1;

      if(
        controlaEstoque &&
        novo > Number(found.stock || 0)
      ){
        alert(
          'QUANTIDADE MAIOR QUE O ESTOQUE DISPONÍVEL.'
        );
        return;
      }

      found.milheiroInteiro = novo;

      found.qty =
        novo +
        (
          Number(found.unidadesAvulsas || 0) /
          1000
        );

    }else if(
      unidade === 'dúzia' ||
      unidade === 'duzia'
    ){

      const atual =
        Number(found.duziaInteira || 0);

      const novo =
        atual + 1;

      if(
        controlaEstoque &&
        novo > Number(found.stock || 0)
      ){
        alert(
          'QUANTIDADE MAIOR QUE O ESTOQUE DISPONÍVEL.'
        );
        return;
      }

      found.duziaInteira = novo;

      found.qty =
        novo +
        (
          Number(found.unidadesAvulsas || 0) /
          12
        );

    }else if(
      unidade === 'm³' ||
      unidade === 'kg'
    ){

      const novo =
        Math.round(
          (
            Number(found.qty || 0) +
            0.5
          ) * 10
        ) / 10;

      if(
        controlaEstoque &&
        novo > Number(found.stock || 0)
      ){
        alert(
          'QUANTIDADE MAIOR QUE O ESTOQUE DISPONÍVEL.'
        );
        return;
      }

      found.qty = novo;

    }else{

      const novo =
        Number(found.qty || 0) + 1;

      if(
        controlaEstoque &&
        novo > Number(found.stock || 0)
      ){
        alert(
          'QUANTIDADE MAIOR QUE O ESTOQUE DISPONÍVEL.'
        );
        return;
      }

      found.qty = novo;
    }

  }else{

    let p =
      state.products.find(
        x => Number(x.id) === Number(id)
      );

    if(!p){

      const cards =
        document.querySelectorAll(
          '#saleProductItems .card'
        );

      // O produto ainda não está no estado local.
      // Nesse caso, não adicionamos dados incompletos.
      alert(
        'Não foi possível localizar este produto. Atualize a página e tente novamente.'
      );

      return;
    }

    const unidade =
      String(p.unidade || '').toLowerCase();

    const isMilheiro =
      unidade === 'milheiro';

    const isDuzia =
      unidade === 'dúzia' ||
      unidade === 'duzia';

    const controlaEstoque =
      p.controla_estoque !== false;

    state.cart.push({

      id: p.id,

      name: p.nome,

      unit: p.unidade,

      price: Number(p.preco || 0),

      stock: Number(p.estoque || 0),

      controlaEstoque,

      qty:
        isMilheiro || isDuzia
          ? 1
          : (
              unidade === 'm³' ||
              unidade === 'kg'
                ? 0.5
                : 1
            ),

      milheiroInteiro:
        isMilheiro ? 1 : 0,

      duziaInteira:
        isDuzia ? 1 : 0,

      unidadesAvulsas: 0
    });
  }

  renderSales(
    document.getElementById('content')
  );
}
function changeCartQty(id, delta){

  const item =
    state.cart.find(x => x.id === id);

  if(!item){
    return;
  }

  const controlaEstoque =
    item.controlaEstoque !== false;

  const unidade =
    String(item.unit || '').toLowerCase();

  const isMilheiro =
    unidade === 'milheiro';

  const isDuzia =
    unidade === 'dúzia' ||
    unidade === 'duzia';

  // ==============================
  // MILHEIRO
  // ==============================

  if(isMilheiro){

    const atual =
      Number(item.milheiroInteiro || 0);

    const novo =
      atual + delta;

    if(novo <= 0){

      state.cart =
        state.cart.filter(x => x.id !== id);

    }else{

      if(
        controlaEstoque &&
        novo > Number(item.stock)
      ){

        alert(
          'QUANTIDADE MAIOR QUE O ESTOQUE DISPONÍVEL.'
        );

        return;
      }

      item.milheiroInteiro =
        novo;

      item.qty =
        novo +
        (
          Number(item.unidadesAvulsas || 0) /
          1000
        );
    }

  // ==============================
  // DÚZIA
  // ==============================

  }else if(isDuzia){

    const atual =
      Number(item.duziaInteira || 0);

    const novo =
      atual + delta;

    if(novo <= 0){

      state.cart =
        state.cart.filter(x => x.id !== id);

    }else{

      if(
        controlaEstoque &&
        novo > Number(item.stock)
      ){

        alert(
          'QUANTIDADE MAIOR QUE O ESTOQUE DISPONÍVEL.'
        );

        return;
      }

      item.duziaInteira =
        novo;

      item.qty =
        novo +
        (
          Number(item.unidadesAvulsas || 0) /
          12
        );
    }

  // ==============================
  // M³ / KG
  // ==============================

  }else if(
    unidade === 'm³' ||
    unidade === 'kg'
  ){

    const step = 0.5;

    const novo =
      Number(item.qty || 0) +
      (delta * step);

    if(novo <= 0){

      state.cart =
        state.cart.filter(x => x.id !== id);

    }else{

      if(
        controlaEstoque &&
        novo > Number(item.stock)
      ){

        alert(
          'QUANTIDADE MAIOR QUE O ESTOQUE DISPONÍVEL.'
        );

        return;
      }

      item.qty =
        novo;
    }

  // ==============================
  // UNIDADE / OUTROS
  // ==============================

  }else{

    const novo =
      Number(item.qty || 0) +
      delta;

    if(novo <= 0){

      state.cart =
        state.cart.filter(x => x.id !== id);

    }else{

      if(
        controlaEstoque &&
        novo > Number(item.stock)
      ){

        alert(
          'QUANTIDADE MAIOR QUE O ESTOQUE DISPONÍVEL.'
        );

        return;
      }

      item.qty =
        novo;
    }
  }

  renderSales(
    document.getElementById('content')
  );
}
function updateMilheiroAvulso(id, value){

  const item =
    state.cart.find(x => x.id === id);

  if(!item){
    return;
  }

  if(
    String(item.unit || '').toLowerCase() !==
    'milheiro'
  ){
    return;
  }

  let unidades =
    Number(value);

  if(
    isNaN(unidades) ||
    unidades < 0
  ){
    unidades = 0;
  }

  unidades =
    Math.floor(unidades);

  if(unidades >= 1000){

    const milheirosExtras =
      Math.floor(unidades / 1000);

    unidades =
      unidades % 1000;

    item.milheiroInteiro =
      Number(item.milheiroInteiro || 0) +
      milheirosExtras;
  }

  const novaQuantidade =
    Number(item.milheiroInteiro || 0) +
    (
      unidades / 1000
    );

  if(
    item.controlaEstoque !== false &&
    novaQuantidade > Number(item.stock || 0)
  ){

    alert(
      `Estoque disponível: ${item.stock} milheiro(s).`
    );

    return;
  }

  item.unidadesAvulsas =
    unidades;

  item.qty =
    Math.round(
      novaQuantidade * 1000
    ) / 1000;

  renderSales(
    document.getElementById('content')
  );
}
function updateDuziaAvulso(id, value){

  const item =
    state.cart.find(x => x.id === id);

  if(!item){
    return;
  }

  const unidade =
    String(item.unit || '').toLowerCase();

  if(
    unidade !== 'dúzia' &&
    unidade !== 'duzia'
  ){
    return;
  }

  let unidades =
    Number(value);

  if(
    isNaN(unidades) ||
    unidades < 0
  ){
    unidades = 0;
  }

  unidades =
    Math.floor(unidades);

  if(unidades >= 12){

    const duziasExtras =
      Math.floor(unidades / 12);

    unidades =
      unidades % 12;

    item.duziaInteira =
      Number(item.duziaInteira || 0) +
      duziasExtras;
  }

  const novaQuantidade =
    Number(item.duziaInteira || 0) +
    (
      unidades / 12
    );

  if(
    item.controlaEstoque !== false &&
    novaQuantidade > Number(item.stock || 0)
  ){

    alert(
      `Estoque disponível: ${item.stock} dúzia(s).`
    );

    return;
  }

  item.unidadesAvulsas =
    unidades;

  item.qty =
    Math.round(
      novaQuantidade * 100
    ) / 100;

  renderSales(
    document.getElementById('content')
  );
}
async function finishSale(){

  if(!state.selectedClient){
    alert('Selecione um cliente antes de continuar.');
    return;
  }

  if(!state.cart.length){
    alert('Adicione pelo menos um produto.');
    return;
  }

const totalMateriais = pcTotal();

const desconto = Math.min(
  Math.max(0, Number(state.saleDiscount) || 0),
  totalMateriais
);

const total = totalMateriais - desconto;
  const content = document.getElementById('content');

  content.innerHTML = `

    <div class="card">

      <div class="section-title">
        <h2>Finalizar venda</h2>
      </div>

<p class="muted">
  Total dos materiais
</p>

<div style="margin-bottom:8px">
  ${money(totalMateriais)}
</div>

<p class="muted">
  Valor abatido
</p>

<div style="margin-bottom:8px">
  ${money(desconto)}
</div>

<p class="muted">
  Total final
</p>

<div class="total" style="font-size:28px;margin-bottom:24px">
  ${money(total)}
</div>
      <div class="section-title">
        <h3>Forma de pagamento</h3>
      </div>

      <div
        style="
          display:grid;
          grid-template-columns:repeat(2,1fr);
          gap:10px;
          margin-bottom:24px;
        "
      >

        <button
          class="secondary"
          onclick="selectPayment('dinheiro')"
        >
          💵 Dinheiro
        </button>

        <button
          class="secondary"
          onclick="selectPayment('pix')"
        >
          📱 PIX
        </button>

        <button
          class="secondary"
          onclick="selectPayment('cartão')"
        >
          💳 Cartão
        </button>

        <button
          class="secondary"
          onclick="selectPayment('prazo')"
        >
          📋 Prazo
        </button>

      </div>

      <div
        id="selectedPayment"
        class="muted"
        style="margin-bottom:24px"
      >
        Nenhuma forma de pagamento selecionada.
      </div>

      <div class="section-title">
        <h3>Tipo de atendimento</h3>
      </div>

      <div
        style="
          display:grid;
          grid-template-columns:repeat(2,1fr);
          gap:10px;
        "
      >

        <button
          class="secondary"
          onclick="selectSaleType('entrega')"
        >
          🚚 Entrega
        </button>

        <button
          class="secondary"
          onclick="selectSaleType('retirada')"
        >
          🏪 Retirada
        </button>

      </div>

      <div
        id="selectedSaleType"
        class="muted"
        style="margin-top:12px"
      >
        Nenhum tipo de atendimento selecionado.
      </div>

      <div
        class="actions"
        style="margin-top:24px"
      >

        <button
          class="secondary"
          onclick="renderSales(document.getElementById('content'))"
        >
          Voltar
        </button>

        <button
          id="confirmSaleButton"
          class="primary"
          onclick="confirmSale()"
          disabled
        >
          Confirmar venda
        </button>

      </div>

    </div>

  `;

  window.salePayment = null;
  window.saleType = null;
}
function selectPayment(payment){

  window.salePayment = payment;

  const el = document.getElementById('selectedPayment');

  if(el){
    el.innerHTML =
      'Pagamento selecionado: <strong>' +
      payment.charAt(0).toUpperCase() +
      payment.slice(1) +
      '</strong>';
  }

  updateConfirmSaleButton();
}


function selectSaleType(type){

  window.saleType = type;

  const el = document.getElementById('selectedSaleType');

  if(el){

    if(type === 'entrega'){

      el.innerHTML = `
        <div>
          Atendimento selecionado:
          <strong>🚚 Entrega</strong>
        </div>

        <div
          class="card"
          style="margin-top:15px;text-align:left"
        >
          <label>
            <strong>📍 Endereço da entrega</strong>
          </label>

          <input
            id="saleDeliveryAddress"
            class="search"
            placeholder="Rua, número, bairro, referência..."
            style="margin-top:8px"
          >

          <p class="muted" style="margin-top:8px">
            Informe o endereço onde o material deverá ser entregue.
          </p>

          <button
            type="button"
            class="secondary"
            style="margin-top:8px"
            onclick="marcarLocalEntrega()"
          >
            📍 Marcar local exato no mapa
          </button>

          <div
            id="saleDeliveryLocationStatus"
            class="muted"
            style="margin-top:10px"
          >
            Localização exata ainda não marcada.
          </div>
        </div>
      `;

      window.saleDeliveryLatitude = null;
      window.saleDeliveryLongitude = null;

    } else {

      el.innerHTML =
        'Atendimento selecionado: <strong>🏪 Retirada</strong>';

      window.saleDeliveryLatitude = null;
      window.saleDeliveryLongitude = null;
    }
  }

  updateConfirmSaleButton();
}
function marcarLocalEntrega(){

  const enderecoInput =
    document.getElementById('saleDeliveryAddress');

  if(!enderecoInput){
    return;
  }

  // Evita abrir dois mapas
  if(document.getElementById('mapaEntrega')){
    return;
  }

  const area = document.createElement('div');

  area.innerHTML = `
    <div class="card" style="margin-top:15px">

      <strong>📍 Escolha o local da entrega</strong>

      <p class="muted">
        Arraste o mapa e clique no ponto exato da entrega.
      </p>

      <div
        id="mapaEntrega"
        style="height:320px;width:100%;border-radius:12px;margin-top:12px"
      ></div>

      <p id="coordenadasEntrega" class="muted">
        Nenhum ponto selecionado.
      </p>

      <button
        type="button"
        class="secondary"
        onclick="document.getElementById('mapaEntrega').parentElement.parentElement.remove()"
      >
        Fechar mapa
      </button>

    </div>
  `;

  enderecoInput.parentElement.appendChild(area);

  // Centro inicial aproximado: Nova Timboteua - PA
  const mapa = L.map('mapaEntrega').setView(
    [-1.208, -47.392],
    13
  );

  L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }
  ).addTo(mapa);

  let marcador = null;

  mapa.on('click', function(e){

    const latitude = e.latlng.lat;
    const longitude = e.latlng.lng;

    if(marcador){
      marcador.setLatLng(e.latlng);
    } else {
      marcador = L.marker(e.latlng).addTo(mapa);
    }

    window.saleDeliveryLatitude = latitude;
    window.saleDeliveryLongitude = longitude;

    document.getElementById('coordenadasEntrega').textContent =
      '📍 Local selecionado com sucesso!';

    document.getElementById('saleDeliveryLocationStatus').textContent =
      '✅ Localização marcada no mapa.';
  });

  setTimeout(() => mapa.invalidateSize(), 200);
}

window.marcarLocalEntrega = marcarLocalEntrega;
function updateConfirmSaleButton(){

  const button =
    document.getElementById('confirmSaleButton');

  if(!button){
    return;
  }

  button.disabled =
    !window.salePayment ||
    !window.saleType;
}
async function confirmSale(){

  if(!window.salePayment){
    alert('Selecione a forma de pagamento.');
    return;
  }

  if(!window.saleType){
    alert('Selecione entrega ou retirada.');
    return;
  }

const totalMateriais = pcTotal();

const desconto = Math.min(
  Math.max(0, Number(state.saleDiscount) || 0),
  totalMateriais
);

const total = totalMateriais - desconto;
  const itens = state.cart.map(item => ({
    produtos_id: item.id,
    quantidade: item.qty,
    preco_unitario: item.price
  }));

  const { data: vendaId, error } =
    await supabaseClient.rpc('registrar_venda', {
      p_cliente_id: state.selectedClient,
      p_valor_total: total,
      p_forma_pagamento: window.salePayment,
      p_itens: itens
    });

  if(error){

    console.error(
      'ERRO AO REGISTRAR VENDA:',
      error
    );

    alert(
      'Não foi possível registrar a venda:\n\n' +
      error.message
    );

    return;
  }

  console.log(
    'VENDA REGISTRADA:',
    vendaId
  );

  if(window.saleType === 'entrega'){

    const { data: ultimaEntrega, error: filaError } =
      await supabaseClient
        .from('entregas')
        .select('posicao_fila')
        .neq('status', 'entregue')
        .order('posicao_fila', { ascending: false })
        .limit(1);

    if(filaError){

      console.error(
        'ERRO AO VERIFICAR FILA:',
        filaError
      );

      alert(
        'A venda foi registrada, mas não foi possível verificar a fila de entregas:\n\n' +
        filaError.message
      );

      return;
    }

    const ultimaPosicao =
      ultimaEntrega && ultimaEntrega.length
        ? Number(ultimaEntrega[0].posicao_fila || 0)
        : 0;

    const novaPosicao = ultimaPosicao + 1;

    const { error: entregaError } =
      await supabaseClient
        .from('entregas')
        .insert({
          venda_id: vendaId,
          prioridade: false,
          posicao_fila: novaPosicao,
          status: 'pendente'
        });

    if(entregaError){

      console.error(
        'ERRO AO CRIAR ENTREGA:',
        entregaError
      );

      alert(
        'A venda foi registrada, mas não foi possível criar a entrega:\n\n' +
        entregaError.message
      );

      return;
    }
  }

state.cart = [];
state.selectedClient = null;
state.saleDiscount = 0;
state.cartOpen = false;

window.salePayment = null;
window.saleType = null;

abrirImpressaoVenda(vendaId, 'pago');

navigate('home');
}
async function abrirImpressaoVenda(vendaId, tipo = 'pago') {

  if (!vendaId) {
    alert('Venda não encontrada.');
    return;
  }

  // ==============================
  // VENDA
  // ==============================

  const { data: venda, error: vendaError } =
    await supabaseClient
      .from('vendas')
      .select(`
        id,
        data,
        valor_total,
        forma_pagamento,
        status,
        cliente_id
      `)
      .eq('id', vendaId)
      .maybeSingle();

  if (vendaError) {
    console.error('ERRO AO CARREGAR VENDA:', vendaError);

    alert(
      'Não foi possível carregar a venda:\n\n' +
      vendaError.message
    );

    return;
  }

  if (!venda) {
    alert('A venda nº ' + vendaId + ' não foi encontrada.');
    return;
  }

  // ==============================
  // CLIENTE
  // ==============================

  let cliente = {};

  if (venda.cliente_id) {
    const { data: clienteData, error: clienteError } =
      await supabaseClient
        .from('clientes')
        .select(`
          nome,
          telefone,
          endereço
        `)
        .eq('id', venda.cliente_id)
        .maybeSingle();

    if (clienteError) {
      console.error(
        'ERRO AO CARREGAR CLIENTE:',
        clienteError
      );
    } else if (clienteData) {
      cliente = clienteData;
    }
  }

  // ==============================
  // ITENS — INCLUI A UNIDADE VENDIDA
  // ==============================

  const { data: itens, error: itensError } =
    await supabaseClient
      .from('itens_venda')
      .select(`
        quantidade,
        subtotal,
        produtos_id,
        unidade_venda
      `)
      .eq('vendas_id', vendaId);

  if (itensError) {
    console.error('ERRO AO CARREGAR ITENS:', itensError);

    alert(
      'Não foi possível carregar os itens da venda:\n\n' +
      itensError.message
    );

    return;
  }

  // ==============================
  // PRODUTOS
  // ==============================

  const produtoIds =
    (itens || [])
      .map(item => item.produtos_id)
      .filter(Boolean);

  let produtos = [];

  if (produtoIds.length) {
    const { data: produtosData, error: produtosError } =
      await supabaseClient
        .from('produtos')
        .select(`
          id,
          nome,
          unidade
        `)
        .in('id', produtoIds);

    if (produtosError) {
      console.error(
        'ERRO AO CARREGAR PRODUTOS:',
        produtosError
      );

      alert(
        'Não foi possível carregar os produtos:\n\n' +
        produtosError.message
      );

      return;
    }

    produtos = produtosData || [];
  }

  // ==============================
  // FORMATADORES
  // ==============================

  const formatarQuantidade = (quantidade) => {
    const numero = Number(quantidade);

    if (Number.isInteger(numero)) {
      return String(numero);
    }

    return numero
      .toFixed(3)
      .replace(/\.?0+$/, '');
  };

  const formatarUnidade = (unidade) => {

    const mapa = {

      'unidade': 'Unidade',
      'dúzia': 'Dúzia',
      'duzia': 'Dúzia',
      'm³': 'm³',
      'kg': 'Kg',
      'milheiro': 'Milheiro',
      'carrada': 'Carrada',
      'balde': 'Balde',
      'saco': 'Saco'

    };

    return mapa[unidade] || unidade || '';

  };


  // ==============================
  // LINHAS DOS PRODUTOS
  // ==============================

  const linhasItens =
    (itens || []).map(item => {

      const produto =
        produtos.find(
          p => Number(p.id) === Number(item.produtos_id)
        ) || {};

      const quantidade =
        formatarQuantidade(item.quantidade);

      const unidade =
  formatarUnidade(item.unidade_venda || produto.unidade);

      return `

        <tr>

          <td class="material">
            ${produto.nome || 'Produto'}
          </td>

          <td class="quantidade">
            ${quantidade}
            <span>${unidade}</span>
          </td>

          <td class="valor">
            ${money(Number(item.subtotal || 0))}
          </td>

        </tr>

      `;

    }).join('');


  // ==============================
  // TIPO DE DOCUMENTO
  // ==============================

  const isOrcamento =
    tipo === 'orcamento';

  const titulo =
    isOrcamento
      ? 'ORÇAMENTO'
      : 'COMPROVANTE DE VENDA';


  const carimbo =
    isOrcamento
      ? ''
      : `

        <div class="carimbo-pago">
          PAGO
        </div>

      `;


  // ==============================
  // HTML DA IMPRESSÃO
  // ==============================

// ==============================
// VALOR ABATIDO
// ==============================

const subtotalItens = (itens || []).reduce(
  (s, item) => s + Number(item.subtotal || 0),
  0
);

const totalFinal = Number(venda.valor_total || 0);

const valorAbatido = Math.max(
  0,
  subtotalItens - totalFinal
);
  const html = `

<!DOCTYPE html>

<html lang="pt-BR">

<head>

<meta charset="UTF-8">

<title>
  ${titulo} - Venda ${venda.id}
</title>


<style>

*{
  box-sizing:border-box;
}


body{

  margin:0;

  padding:15px;

  background:#eee;

  font-family:
    Arial,
    Helvetica,
    sans-serif;

  color:#111;

}


.folha{

  width:210mm;

  min-height:297mm;

  margin:0 auto;

  background:#fff;

  padding:10mm;

}


.via{

  position:relative;

  min-height:125mm;

}


.cabecalho{

  position:relative;

  text-align:center;

  border-bottom:1px solid #222;

  padding-bottom:8px;

  margin-bottom:8px;

}


.logo{

  width:85px;

  height:auto;

  margin-bottom:5px;

}


.empresa{

  font-size:22px;

  font-weight:bold;

}


.subtitulo{

  font-size:11px;

  margin-top:3px;

}


.dados-empresa{

  font-size:10px;

  margin-top:4px;

}


.via-titulo{

  text-align:right;

  font-size:10px;

  font-weight:bold;

  margin-bottom:3px;

}


.identificacao{

  display:flex;

  justify-content:space-between;

  gap:10px;

  font-size:11px;

  margin-bottom:8px;

}


.cliente{

  font-size:11px;

  margin-bottom:9px;

  border-bottom:1px solid #aaa;

  padding-bottom:6px;

}


.tabela{

  width:100%;

  border-collapse:collapse;

  font-size:11px;

}


.tabela th{

  border-bottom:1px solid #222;

  padding:4px;

  text-align:left;

}


.tabela td{

  padding:5px 4px;

  border-bottom:1px solid #ddd;

}


.material{

  width:55%;

  text-transform:uppercase;

  font-weight:600;

}


.quantidade{

  width:20%;

  text-align:center;

}


.quantidade span{

  font-size:9px;

  display:block;

  color:#555;

}


.valor{

  width:25%;

  text-align:right;

  font-weight:bold;

}


.total{

  display:flex;

  justify-content:space-between;

  border-top:2px solid #222;

  margin-top:8px;

  padding-top:7px;

  font-size:15px;

  font-weight:bold;

}


.abatido{

  display:flex;

  justify-content:space-between;

  margin-top:6px;

  font-size:11px;

}


.pagamento{

  margin-top:6px;

  font-size:10px;

}


.rodape{

  margin-top:10px;

  text-align:center;

  font-size:9px;

}


.linha-corte{

  border-top:2px dashed #555;

  margin:5mm 0;

  padding-top:3px;

  text-align:center;

  font-size:9px;

  color:#555;

}


.carimbo-pago{

  position:absolute;

  right:15px;

  top:38px;

  border:4px solid #b00000;

  color:#b00000;

  padding:5px 12px;

  font-size:24px;

  font-weight:900;

  letter-spacing:2px;

  transform:rotate(-10deg);

  opacity:.85;

}


.orcamento{

  text-align:center;

  font-size:15px;

  font-weight:bold;

  margin-bottom:7px;

}


@media print{

  body{

    padding:0;

    background:#fff;

  }


  .folha{

    width:210mm;

    min-height:297mm;

    margin:0;

    padding:8mm;

  }


  @page{

    size:A4;

    margin:0;

  }

}

</style>

</head>


<body>


<div class="folha">


  <!-- ========================= -->
  <!-- VIA CLIENTE -->
  <!-- ========================= -->

  <div class="via">


    <div class="via-titulo">
      VIA CLIENTE
    </div>


    ${carimbo}


    <div class="cabecalho">

<img
  src="https://raw.githubusercontent.com/pontodaconstrucaowp-ops/ponto-da-construcao/main/logo-ponto-construcao.png"
  alt="Ponto da Construção"
  style="
width: 80px;
    max-width: 100%;
    height: auto;
    display: block;
    margin: 0 auto 8px auto;
  "
>


      <div class="empresa">
        PONTO DA CONSTRUÇÃO
      </div>


      <div class="subtitulo">
        MATERIAIS DE CONSTRUÇÃO
      </div>


      <div class="dados-empresa">
        Atendimento e materiais de construção
      </div>

    </div>


    ${
      isOrcamento
        ? `
          <div class="orcamento">
            ORÇAMENTO
          </div>
        `
        : ''
    }


    <div class="identificacao">

      <div>
        Venda nº:
        <strong>${venda.id}</strong>
      </div>


      <div>
        Data:
        <strong>
          ${new Date(venda.data).toLocaleString('pt-BR')}
        </strong>
      </div>

    </div>


    <div class="cliente">

      <strong>Cliente:</strong>
      ${cliente.nome || 'Não informado'}


      ${
        cliente.telefone
          ? `
            &nbsp;&nbsp; | &nbsp;&nbsp;

            <strong>Tel.:</strong>
            ${cliente.telefone}
          `
          : ''
      }


      ${
        cliente.endereço
          ? `
            <br>

            <strong>End.:</strong>
            ${cliente.endereço}
          `
          : ''
      }

    </div>


    <table class="tabela">

      <thead>

        <tr>

          <th>
            MATERIAL
          </th>

          <th>
            QUANTIDADE
          </th>

          <th style="text-align:right">
            TOTAL
          </th>

        </tr>

      </thead>


      <tbody>

        ${linhasItens}

      </tbody>

    </table>


    <div class="total">

      <span>
        TOTAL GERAL:
      </span>

      <span>
       ${money(totalFinal)}
      </span>

    </div>


    <div class="abatido">

      <span>
        VALOR ABATIDO:
      </span>

      <span>
       ${money(valorAbatido)}
      </span>

    </div>


    ${
      !isOrcamento
        ? `
          <div class="pagamento">

            <strong>
              Forma de pagamento:
            </strong>

            ${venda.forma_pagamento || '-'}

          </div>
        `
        : ''
    }


    <div class="rodape">

      Obrigado pela preferência!

    </div>


  </div>


  <!-- ========================= -->
  <!-- CORTE -->
  <!-- ========================= -->

  <div class="linha-corte">

    ✂
    ------------------------------------------------------------
    ✂

  </div>


  <!-- ========================= -->
  <!-- VIA EMPRESA -->
  <!-- ========================= -->

  <div class="via">


    <div class="via-titulo">

      VIA EMPRESA -
      CONFERÊNCIA / COMPRAS

    </div>


    ${carimbo}


    <div class="cabecalho">

      <div
        style="
          font-size:18px;
          font-weight:bold;
          margin-bottom:5px;
        "
      >
        PONTO DA CONSTRUÇÃO
      </div>


      <div class="empresa">
        PONTO DA CONSTRUÇÃO
      </div>


      <div class="subtitulo">
        MATERIAIS DE CONSTRUÇÃO
      </div>


      <div class="dados-empresa">
        Controle interno
      </div>

    </div>


    ${
      isOrcamento
        ? `
          <div class="orcamento">
            ORÇAMENTO
          </div>
        `
        : ''
    }


    <div class="identificacao">

      <div>
        Venda nº:
        <strong>${venda.id}</strong>
      </div>


      <div>
        Data:
        <strong>
          ${new Date(venda.data).toLocaleString('pt-BR')}
        </strong>
      </div>

    </div>


    <div class="cliente">

      <strong>Cliente:</strong>
      ${cliente.nome || 'Não informado'}


      ${
        cliente.telefone
          ? `
            &nbsp;&nbsp; | &nbsp;&nbsp;

            <strong>Tel.:</strong>
            ${cliente.telefone}
          `
          : ''
      }


      ${
        cliente.endereço
          ? `
            <br>

            <strong>End.:</strong>
            ${cliente.endereço}
          `
          : ''
      }

    </div>


    <table class="tabela">

      <thead>

        <tr>

          <th>
            MATERIAL
          </th>

          <th>
            QUANTIDADE
          </th>

          <th style="text-align:right">
            TOTAL
          </th>

        </tr>

      </thead>


      <tbody>

        ${linhasItens}

      </tbody>

    </table>


    <div class="total">

      <span>
        TOTAL GERAL:
      </span>

      <span>
        ${money(totalFinal)}
      </span>

    </div>


    <div class="abatido">

      <span>
        VALOR ABATIDO:
      </span>

      <span>
  ${money(valorAbatido)}
      </span>

    </div>


    ${
      !isOrcamento
        ? `
          <div class="pagamento">

            <strong>
              Forma de pagamento:
            </strong>

            ${venda.forma_pagamento || '-'}

          </div>
        `
        : ''
    }


    <div class="rodape">

      Controle interno — Via da empresa

    </div>


  </div>


</div>


<script>

window.onload = function(){

  window.focus();

  setTimeout(function(){

    window.print();

  }, 400);

};

</script>


</body>

</html>

  `;


  // ==============================
  // ABRIR IMPRESSÃO
  // ==============================

  const janela =
    window.open(
      '',
      '_blank',
      'width=900,height=700'
    );


  if(!janela){

    alert(
      'O navegador bloqueou a janela de impressão. Permita pop-ups para este site.'
    );

    return;
  }


  janela.document.open();

  janela.document.write(html);

  janela.document.close();

}
async function renderProducts(el){

  el.innerHTML = `
    <div class="row" style="margin-bottom:12px">
      <input
        class="search"
        id="productSearch"
        oninput="filterProducts()"
        placeholder="Buscar material..."
      >

      <button
        class="primary"
        onclick="openProductForm()"
      >
        + Produto
      </button>
    </div>

    <div id="productList" class="list">
      <div class="card muted">
        Carregando estoque...
      </div>
    </div>
  `;

  const { data, error } = await supabaseClient
    .from('produtos')
    .select('*')
.order('nome', { ascending: true });

  const list = document.getElementById('productList');

  if(error){
    console.error(error);

    list.innerHTML = `
      <div class="card">
        <strong>Erro ao carregar estoque</strong>
        <p class="muted">${error.message}</p>
      </div>
    `;

    return;
  }
state.products = data || [];
  
  if(!data || data.length === 0){
    list.innerHTML = `
      <div class="card">
        <strong>Nenhum produto cadastrado</strong>
        <p class="muted">
          Clique em "+ Produto" para cadastrar.
        </p>
      </div>
    `;

    return;
  }

window.currentProducts = data;
list.innerHTML = productRows(data);
}


function openProductForm(){

  // Evita criar vários modais ao mesmo tempo
  document
    .getElementById('productModal')
    ?.remove();

  const modal = document.createElement('div');

  modal.id = 'productModal';

  modal.style.position = 'fixed';
  modal.style.inset = '0';
  modal.style.zIndex = '9999';
  
  modal.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-card">

        <div class="modal-header">
          <h2>Novo produto</h2>

          <button
            type="button"
            onclick="document.getElementById('productModal')?.remove()"
          >
            ✕
          </button>

        </div>

        <div class="modal-body">

          <label>
            Nome do produto
          </label>

          <input
            id="newProductName"
            type="text"
            placeholder="Ex.: Cimento Poty"
          >

          <label>
            Categoria
          </label>

          <input
            id="newProductCategory"
            type="text"
            placeholder="Ex.: Cimento"
          >

          <label>
            Unidade
          </label>

          <select id="newProductUnit">

            <option value="m³">m³</option>
            <option value="kg">kg</option>
            <option value="carrada">carrada</option>
            <option value="balde">balde</option>
            <option value="lata">lata</option>
            <option value="saco">saco</option>
            <option value="unidade">unidade</option>
            <option value="milheiro">milheiro</option>

          </select>

          <label>
            Preço
          </label>

          <input
            id="newProductPrice"
            type="number"
            min="0"
            step="0.01"
            placeholder="0,00"
          >

          <label>
            Tipo de produto
          </label>

          <select id="newProductStockType">

            <option value="estoque">
              📦 Tem no estoque
            </option>

            <option value="revenda">
              🛒 Item de revenda
            </option>

          </select>

          <div id="stockFields">

            <label>
              Estoque atual
            </label>

            <input
              id="newProductStock"
              type="number"
              min="0"
              step="0.01"
              value="0"
            >

            <label>
              Estoque mínimo
            </label>

            <input
              id="newProductMinStock"
              type="number"
              min="0"
              step="0.01"
              value="0"
            >

          </div>

          <button
            type="button"
            id="saveNewProductButton"
            class="primary-button"
          >
            Cadastrar produto
          </button>

        </div>

      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const stockType =
    document.getElementById('newProductStockType');

  const stockFields =
    document.getElementById('stockFields');

  function updateStockFields(){

    if(stockType.value === 'revenda'){

      stockFields.style.display = 'none';

    }else{

      stockFields.style.display = 'block';

    }

  }

  stockType.addEventListener(
    'change',
    updateStockFields
  );

  updateStockFields();

  document
    .getElementById('saveNewProductButton')
    .addEventListener('click', async () => {

      const nome =
        document
          .getElementById('newProductName')
          .value
          .trim();

      const categoria =
        document
          .getElementById('newProductCategory')
          .value
          .trim();

      const unidade =
        document
          .getElementById('newProductUnit')
          .value;

      const preco =
        Number(
          document
            .getElementById('newProductPrice')
            .value
        );

      const tipoProduto =
        document
          .getElementById('newProductStockType')
          .value;

      const controlaEstoque =
        tipoProduto === 'estoque';

      const estoque =
        controlaEstoque
          ? Number(
              document
                .getElementById('newProductStock')
                .value
            )
          : 0;

      const estoqueMinimo =
        controlaEstoque
          ? Number(
              document
                .getElementById('newProductMinStock')
                .value
            )
          : 0;

      if(!nome){

        alert('Informe o nome do produto.');
        return;

      }

      if(!categoria){

        alert('Informe a categoria.');
        return;

      }

      if(!Number.isFinite(preco) || preco < 0){

        alert('Informe um preço válido.');
        return;

      }

      if(
        !Number.isFinite(estoque) ||
        estoque < 0
      ){

        alert('Informe um estoque válido.');
        return;

      }

      if(
        !Number.isFinite(estoqueMinimo) ||
        estoqueMinimo < 0
      ){

        alert('Informe um estoque mínimo válido.');
        return;

      }

      const { error } =
        await supabaseClient
          .from('produtos')
          .insert({

            nome: nome,

            categoria: categoria,

            unidade: unidade,

            preco: preco,

            estoque: estoque,

            estoque_minimo: estoqueMinimo,

            controla_estoque:
              controlaEstoque

          });

      if(error){

        console.error(
          'Erro ao cadastrar produto:',
          error
        );

        alert(
          'Não foi possível cadastrar o produto.'
        );

        return;

      }

      alert(
        'Produto cadastrado com sucesso!'
      );

      document
        .getElementById('productModal')
        ?.remove();

      renderProducts(
        document.getElementById('content')
      );

    });

}

function productRows(items){
  return items.map(p => `
    <div class="card">
      <div class="row">
        <div>
          <div class="product-name">${p.nome}</div>

          <span class="muted">
            ${p.unidade} · estoque ${p.estoque}
          </span>
        </div>

        <strong class="price">
          ${money(p.preco)}
        </strong>
      </div>

     <div class="actions">

  <button
    class="secondary"
    onclick="openProductEdit(${p.id})"
  >
    Editar
  </button>

  <button
    class="danger"
    onclick="deleteProduct(${p.id})"
  >
    Excluir
  </button>

</div>
    </div>
  `).join('');
}
function openProductEdit(id){

  const produto = (window.currentProducts || []).find(
    p => p.id === id
  );

  if(!produto){
    alert('Produto não encontrado.');
    return;
  }

  document
    .getElementById('productModal')
    ?.remove();

  const modal = document.createElement('div');

  modal.id = 'productModal';

  modal.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-card">

        <div class="modal-header">
          <h2>Editar produto</h2>

          <button
            type="button"
            onclick="document.getElementById('productModal')?.remove()"
          >
            ✕
          </button>
        </div>

        <div class="modal-body">

          <label>
            Nome do produto
          </label>

          <input
            id="editProductName"
            type="text"
            value="${produto.nome || ''}"
          >

          <label>
            Categoria
          </label>

          <input
            id="editProductCategory"
            type="text"
            value="${produto.categoria || ''}"
          >

          <label>
            Unidade
          </label>

          <select id="editProductUnit">

            <option value="m³" ${produto.unidade === 'm³' ? 'selected' : ''}>m³</option>
            <option value="kg" ${produto.unidade === 'kg' ? 'selected' : ''}>kg</option>
            <option value="carrada" ${produto.unidade === 'carrada' ? 'selected' : ''}>carrada</option>
            <option value="balde" ${produto.unidade === 'balde' ? 'selected' : ''}>balde</option>
            <option value="lata" ${produto.unidade === 'lata' ? 'selected' : ''}>lata</option>
            <option value="saco" ${produto.unidade === 'saco' ? 'selected' : ''}>saco</option>
            <option value="unidade" ${produto.unidade === 'unidade' ? 'selected' : ''}>unidade</option>
            <option value="milheiro" ${produto.unidade === 'milheiro' ? 'selected' : ''}>milheiro</option>

          </select>

          <label>
            Preço
          </label>

          <input
            id="editProductPrice"
            type="number"
            min="0"
            step="0.01"
            value="${Number(produto.preco || 0)}"
          >

          <label>
            Tipo de produto
          </label>

          <select id="editProductStockType">

            <option
              value="estoque"
              ${produto.controla_estoque !== false ? 'selected' : ''}
            >
              📦 Tem no estoque
            </option>

            <option
              value="revenda"
              ${produto.controla_estoque === false ? 'selected' : ''}
            >
              🛒 Item de revenda
            </option>

          </select>

          <div id="editStockFields">

            <label>
              Estoque atual
            </label>

            <input
              id="editProductStock"
              type="number"
              min="0"
              step="0.01"
              value="${Number(produto.estoque || 0)}"
            >

            <label>
              Estoque mínimo
            </label>

            <input
              id="editProductMinStock"
              type="number"
              min="0"
              step="0.01"
              value="${Number(produto.estoque_minimo || 0)}"
            >

          </div>

          <div class="actions">

            <button
              type="button"
              class="secondary"
              onclick="document.getElementById('productModal')?.remove()"
            >
              Cancelar
            </button>

            <button
              type="button"
              id="saveProductEditButton"
              class="primary"
            >
              Salvar alterações
            </button>

          </div>

        </div>

      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const stockType =
    document.getElementById('editProductStockType');

  const stockFields =
    document.getElementById('editStockFields');

  function updateEditStockFields(){

    if(stockType.value === 'revenda'){

      stockFields.style.display = 'none';

    }else{

      stockFields.style.display = 'block';

    }

  }

  stockType.addEventListener(
    'change',
    updateEditStockFields
  );

  updateEditStockFields();

  document
    .getElementById('saveProductEditButton')
    .addEventListener('click', () => {
      saveProductEdit(id);
    });
}
async function saveProductEdit(id){

  const nome =
    document
      .getElementById('editProductName')
      .value
      .trim();

  const categoria =
    document
      .getElementById('editProductCategory')
      .value
      .trim();

  const unidade =
    document
      .getElementById('editProductUnit')
      .value;

  const preco =
    Number(
      document
        .getElementById('editProductPrice')
        .value
    );

  const tipoProduto =
    document
      .getElementById('editProductStockType')
      .value;

  const controlaEstoque =
    tipoProduto === 'estoque';

  const estoque =
    controlaEstoque
      ? Number(
          document
            .getElementById('editProductStock')
            .value
        )
      : 0;

  const estoqueMinimo =
    controlaEstoque
      ? Number(
          document
            .getElementById('editProductMinStock')
            .value
        )
      : 0;

  if(!nome){
    alert('Informe o nome do produto.');
    return;
  }

  if(!categoria){
    alert('Informe a categoria.');
    return;
  }

  if(!unidade){
    alert('Informe a unidade.');
    return;
  }

  if(!Number.isFinite(preco) || preco < 0){
    alert('Informe um preço válido.');
    return;
  }

  if(!Number.isFinite(estoque) || estoque < 0){
    alert('Informe um estoque válido.');
    return;
  }

  if(!Number.isFinite(estoqueMinimo) || estoqueMinimo < 0){
    alert('Informe um estoque mínimo válido.');
    return;
  }

  const { error } =
    await supabaseClient
      .from('produtos')
      .update({
        nome: nome,
        categoria: categoria,
        unidade: unidade,
        preco: preco,
        estoque: estoque,
        estoque_minimo: estoqueMinimo,
        controla_estoque: controlaEstoque
      })
      .eq('id', id);

  if(error){

    console.error(
      'Erro ao atualizar produto:',
      error
    );

    alert(
      'Não foi possível atualizar o produto:\n\n' +
      error.message
    );

    return;
  }

  alert('Produto atualizado com sucesso!');

  document
    .getElementById('productModal')
    ?.remove();

  renderProducts(
    document.getElementById('content')
  );
}
function filterProducts(){

  const input = document.getElementById('productSearch');
  const list = document.getElementById('productList');

  if(!input || !list) return;

  const busca = input.value
    .trim()
    .toLowerCase();

  const produtos = window.currentProducts || [];

  const filtrados = produtos.filter(p =>
    String(p.nome || '')
      .toLowerCase()
      .includes(busca)
  );

  list.innerHTML = filtrados.length
    ? productRows(filtrados)
    : `
      <div class="card">
        <strong>Nenhum produto encontrado</strong>
        <p class="muted">
          Não encontramos nenhum material com "${input.value}".
        </p>
      </div>
    `;
}
async function renderDeliveries(el){

  el.innerHTML = `
    <div class="card">
      <strong>Fila de entregas</strong>
      <p class="muted">
        Carregando entregas...
      </p>
    </div>
  `;

  const { data, error } = await supabaseClient
    .from('entregas')
    .select(`
      id,
      venda_id,
      prioridade,
      posicao_fila,
      status,
      endereço,
      entregador_id,
      vendas (
        id,
        valor_total,
        forma_pagamento,
        status,
        clientes (
          nome,
          telefone,
          endereço
        )
      )
    `)
    .order('posicao_fila', { ascending: true });

  if(error){

    console.error(
      'ERRO AO CARREGAR ENTREGAS:',
      error
    );

    el.innerHTML = `
      <div class="card">
        <strong>Erro ao carregar entregas</strong>
        <p class="muted">
          ${error.message}
        </p>
      </div>
    `;

    return;
  }

  if(!data || data.length === 0){

    el.innerHTML = `
      <div class="card">
        <strong>Nenhuma entrega na fila</strong>
        <p class="muted">
          As entregas aparecerão aqui quando forem criadas.
        </p>
      </div>
    `;

    return;
  }

  el.innerHTML = `
    <div class="card">
      <strong>Fila de entregas</strong>
      <p class="muted">
        ${data.length} entrega(s) na fila.
      </p>
    </div>

    <div class="list" style="margin-top:12px">

      ${data.map((d, i) => {

        const venda = d.vendas;
        const cliente = venda?.clientes;

        const endereco =
          d.endereço ||
          cliente?.endereço ||
          'Endereço não informado';

        const nomeCliente =
          cliente?.nome ||
          'Cliente não informado';

        const telefone =
          cliente?.telefone ||
          'Sem telefone';

        const valor =
          Number(venda?.valor_total || 0);

        return `

          <div class="card">

            <div class="row">
              <strong>
                #${d.id} · ${nomeCliente}
              </strong>

              <span class="badge ${d.status}">
                ${d.status}
              </span>
            </div>

            <p class="muted">
              📍 ${endereco}
            </p>

            <p class="muted">
              ☎ ${telefone}
            </p>

            <div class="row">
              <span>
                ${money(valor)}
              </span>

              <span class="muted">
                ${venda?.forma_pagamento || ''}
              </span>
            </div>

            <div class="actions">
            
<button
  type="button"
  class="secondary"
  onclick="abrirMapaEntrega('${encodeURIComponent(endereco)}')"
>
  🗺️ Ver no mapa
</button>

            ${d.status !== 'entregue' ? `

  ${i > 0 ? `
    <button
      class="secondary"
      onclick="moveDelivery(${d.id},-1)"
    >
      ↑ Colocar na frente
    </button>
  ` : ''}

  ${i < data.length - 1 ? `
    <button
      class="secondary"
      onclick="moveDelivery(${d.id},1)"
    >
      ↓
    </button>
  ` : ''}

` : ''}

              ${d.status !== 'entregue' ? `
                <button
                  class="primary"
                  onclick="nextDelivery(${d.id})"
                >
                  ${d.status === 'pendente'
                    ? 'Iniciar rota'
                    : 'Marcar entregue'}
                </button>
              ` : ''}

            </div>

          </div>

        `;

      }).join('')}

    </div>
  `;
}
function abrirMapaEntrega(endereco){

  const enderecoDecodificado =
    decodeURIComponent(endereco);

  if(
    !enderecoDecodificado ||
    enderecoDecodificado === 'Endereço não informado'
  ){
    alert('Esta entrega não possui endereço cadastrado.');
    return;
  }

  const url =
    'https://www.google.com/maps/search/?api=1&query=' +
    encodeURIComponent(enderecoDecodificado);

  window.open(url, '_blank');
}

window.abrirMapaEntrega = abrirMapaEntrega;

async function moveDelivery(id, direction){

  const { data, error } = await supabaseClient
    .from('entregas')
    .select('id, posicao_fila, prioridade, status')
    .neq('status', 'entregue')
    .order('posicao_fila', { ascending: true });

  if(error){

    console.error(
      'ERRO AO CARREGAR FILA:',
      error
    );

    alert(
      'Não foi possível organizar a fila:\n\n' +
      error.message
    );

    return;
  }

  if(!data || data.length < 2){
    return;
  }

  const index = data.findIndex(
    entrega => Number(entrega.id) === Number(id)
  );

  if(index === -1){

 console.log(
  'ID RECEBIDO:',
  id,
  'IDS ENCONTRADOS:',
  data.map(entrega => entrega.id)
);

  alert(
    'Entrega não encontrada na fila.\n\n' +
    'ID recebido: ' + id
  );

  return;
}
  const newIndex = index + direction;

  if(newIndex < 0 || newIndex >= data.length){
    return;
  }

  const atual = data[index];
  const destino = data[newIndex];

  const posicaoAtual = atual.posicao_fila;
  const posicaoDestino = destino.posicao_fila;

  const { error: errorTemp } =
    await supabaseClient
      .from('entregas')
      .update({
        posicao_fila: -1
      })
      .eq('id', atual.id);

  if(errorTemp){

    console.error(
      'ERRO AO mover entrega:',
      errorTemp
    );

    alert(
      'Não foi possível mover a entrega:\n\n' +
      errorTemp.message
    );

    return;
  }

  const { error: errorDestino } =
    await supabaseClient
      .from('entregas')
      .update({
        posicao_fila: posicaoAtual
      })
      .eq('id', destino.id);

  console.log('MOVIMENTAÇÃO:', {
  atual: atual.id,
  destino: destino.id,
  posicaoAtual: posicaoAtual,
  posicaoDestino: posicaoDestino,
  erro: errorDestino
});
  
  if(errorDestino){

    console.error(
      'ERRO AO atualizar posição:',
      errorDestino
    );

    await supabaseClient
      .from('entregas')
      .update({
        posicao_fila: posicaoAtual
      })
      .eq('id', atual.id);

    alert(
      'Não foi possível reorganizar a fila:\n\n' +
      errorDestino.message
    );

    return;
  }

  const { error: errorAtual } =
    await supabaseClient
      .from('entregas')
      .update({
        posicao_fila: posicaoDestino
      })
      .eq('id', atual.id);

  if(errorAtual){

    console.error(
      'ERRO AO finalizar movimentação:',
      errorAtual
    );

    alert(
      'A fila pode não ter sido atualizada corretamente.'
    );

    return;
  }

await renderDeliveries(
  document.getElementById('content')
);
}

async function nextDelivery(id){

  const { data, error } = await supabaseClient
    .from('entregas')
    .select('id, status, posicao_fila')
    .eq('id', id)
    .single();

  if(error){

    console.error(
      'ERRO AO BUSCAR ENTREGA:',
      error
    );

    alert(
      'Não foi possível carregar a entrega:\n\n' +
      error.message
    );

    return;
  }

  if(!data){
    alert('Entrega não encontrada.');
    return;
  }

  let novoStatus = data.status;

  if(data.status === 'pendente'){
    novoStatus = 'em_rota';
  }
  else if(data.status === 'em_rota'){
    novoStatus = 'entregue';
  }
  else {
    return;
  }

  const atualizacao = {
    status: novoStatus
  };

  if(novoStatus === 'entregue'){
    atualizacao.posicao_fila = -1;
  }

  const { error: updateError } =
    await supabaseClient
      .from('entregas')
      .update(atualizacao)
      .eq('id', id);

  if(updateError){

    console.error(
      'ERRO AO ATUALIZAR ENTREGA:',
      updateError
    );

    alert(
      'Não foi possível atualizar a entrega:\n\n' +
      updateError.message
    );

    return;
  }

  await renderDeliveries(
    document.getElementById('content')
  );
}
async function renderReports(el){

  el.innerHTML = `
    <div class="card">

      <div class="section-title">
        <h2>Relatórios</h2>
      </div>

      <div class="row" style="gap:10px; flex-wrap:wrap; margin-bottom:15px;">

        <div class="field" style="flex:1; min-width:140px;">
          <label>Data inicial</label>
          <input
            id="reportDateStart"
            class="search"
            type="date"
          >
        </div>

        <div class="field" style="flex:1; min-width:140px;">
          <label>Data final</label>
          <input
            id="reportDateEnd"
            class="search"
            type="date"
          >
        </div>

        <button
          class="btn primary"
          onclick="carregarRelatorio()"
          style="margin-top:22px;"
        >
          Filtrar
        </button>

      </div>

      <div id="reportSummary"></div>

      <div id="reportsList" class="list">
        <div class="muted">Carregando vendas...</div>
      </div>

    </div>
  `;

  await carregarRelatorio();
}


async function carregarRelatorio(){

  const lista = document.getElementById('reportsList');

  if(!lista){
    return;
  }

  lista.innerHTML = `
    <div class="muted">
      Carregando vendas...
    </div>
  `;

  const inicio =
    document.getElementById('reportDateStart')?.value;

  const fim =
    document.getElementById('reportDateEnd')?.value;

  let query = supabaseClient
    .from('vendas')
    .select('*')
    .order('id', { ascending:false });

  if(inicio){
    query = query.gte('data', inicio);
  }

  if(fim){
    query = query.lte('data', fim + 'T23:59:59');
  }

  const { data: vendas, error } = await query;

  if(error){

    console.error(error);

    lista.innerHTML = `
      <div class="card">
        <strong>Erro ao carregar vendas</strong>
        <p class="muted">${error.message}</p>
      </div>
    `;

    return;
  }

  if(!vendas || vendas.length === 0){

    document.getElementById('reportSummary').innerHTML = '';

    lista.innerHTML = `
      <div class="card">
        <p class="muted">
          Nenhuma venda encontrada nesse período.
        </p>
      </div>
    `;

    return;
  }

  const clientesIds = [
    ...new Set(
      vendas
        .map(v => v.cliente_id)
        .filter(Boolean)
    )
  ];

  let clientes = [];

  if(clientesIds.length){

    const respostaClientes =
      await supabaseClient
        .from('clientes')
        .select('id,nome,telefone')
        .in('id', clientesIds);

    clientes = respostaClientes.data || [];
  }

  const mapaClientes = {};

  clientes.forEach(cliente => {
    mapaClientes[cliente.id] = cliente;
  });

  const totalVendido =
    vendas.reduce(
      (soma, venda) =>
        soma + Number(venda.valor_total || 0),
      0
    );

  document.getElementById('reportSummary').innerHTML = `
    <div class="card" style="margin-bottom:15px;">

      <div class="row">
        <span>Quantidade de vendas</span>
        <strong>${vendas.length}</strong>
      </div>

      <div class="row">
        <span>Total vendido</span>
        <strong class="total">
          ${money(totalVendido)}
        </strong>
      </div>

    </div>
  `;

  lista.innerHTML =
    vendas.map(venda => {

      const cliente =
        mapaClientes[venda.cliente_id];

      const nomeCliente =
        cliente?.nome || 'Cliente não informado';

      const formaPagamento =
        venda.forma_pagamento || 'Não informado';

      const dataVenda =
        venda.data
          ? new Date(venda.data).toLocaleString('pt-BR')
          : 'Data não informada';

      return `
        <div class="card">

          <div class="row">

            <strong>
              Venda #${venda.id}
            </strong>

            <strong class="total">
              ${money(Number(venda.valor_total || 0))}
            </strong>

          </div>

          <div class="muted">
            ${nomeCliente}
          </div>

          <div class="muted">
            ${dataVenda}
          </div>

          <div class="muted">
            Pagamento: ${formaPagamento}
          </div>

          <div class="row" style="margin-top:12px;">

            <span class="muted">
              Status: ${venda.status || '—'}
            </span>

            <button
              class="btn primary"
              onclick="abrirImpressaoVenda(${venda.id}, 'pago')"
            >
              Imprimir
            </button>

          </div>

        </div>
      `;

    }).join('');
}
function renderMore(el){
 el.innerHTML=`<div class="list">
 <button class="card" onclick="navigate('clients')"><strong>Clientes</strong><span class="muted">Cadastro e histórico</span></button>
 <button class="card" onclick="navigate('cash')"><strong>Caixa / Financeiro</strong><span class="muted">Entradas, saídas e saldo</span></button>
 <button class="card" onclick="navigate('reports')"><strong>Relatórios</strong><span class="muted">Resumo de vendas e operação</span></button>
 <button class="card" onclick="navigate('settings')"><strong>Configurações</strong><span class="muted">Usuários e preferências</span></button>
 </div>`;
}
function abrirMapaCliente(origem = 'cadastro') {

  const venda = origem === 'venda';

  const mapaId = venda ? 'mapaClienteVenda' : 'mapaCliente';

  const statusId = venda
    ? 'localizacaoClienteVendaStatus'
    : 'localizacaoClienteStatus';

  const mapaDiv = document.getElementById(mapaId);
  const status = document.getElementById(statusId);

  if (!mapaDiv) {
    alert('Área do mapa não encontrada.');
    return;
  }

  if (typeof L === 'undefined') {
    alert('Não foi possível carregar o mapa.');
    return;
  }

  mapaDiv.style.display = 'block';

  // Evita criar o mesmo mapa duas vezes
  if (mapaDiv._leaflet_id) {
    return;
  }

// Centro inicial aproximado de Vigia de Nazaré - PA
const mapa = L.map(mapaId).setView(
  [-0.858, -48.141],
  15
);

  L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }
  ).addTo(mapa);

  let marcador = null;

  mapa.on('click', function(evento) {

    const latitude = evento.latlng.lat;
    const longitude = evento.latlng.lng;

    if (marcador) {
      marcador.setLatLng(evento.latlng);
    } else {
      marcador = L.marker(evento.latlng).addTo(mapa);
    }

    if (venda) {
      window.clienteVendaLatitude = latitude;
      window.clienteVendaLongitude = longitude;
    } else {
      window.clienteLatitude = latitude;
      window.clienteLongitude = longitude;
    }

    status.textContent =
      '✅ Localização marcada com sucesso!';
  });

  setTimeout(() => {
    mapa.invalidateSize();
  }, 200);
}

window.abrirMapaCliente = abrirMapaCliente;
function openClientForm(){
  const content = document.getElementById('content');

  content.innerHTML = `
    <div class="card">
      <div class="section-title">
        <h2>Novo cliente</h2>
      </div>

      <div style="display:grid;gap:12px">
        <input id="clientName" class="search" placeholder="Nome do cliente">

        <input id="clientPhone" class="search" placeholder="Telefone">

        <textarea id="clientAddress" class="search" placeholder="Endereço" rows="3"></textarea>
        <button
  type="button"
  class="secondary"
  onclick="abrirMapaCliente()"
>
  📍 Marcar localização no mapa
</button>

<div
  id="mapaCliente"
  style="
    display:none;
    height:350px;
    width:100%;
    border-radius:12px;
    overflow:hidden;
  "
></div>

<p id="localizacaoClienteStatus" class="muted">
  Nenhuma localização marcada.
</p>

        <div class="row">
          <button class="secondary" onclick="navigate('clients')">
            Cancelar
          </button>

          <button class="primary" onclick="saveClient()">
            Salvar cliente
          </button>
        </div>
      </div>
    </div>
  `;
}
async function renderClients(el){

  el.innerHTML = `
    <div class="row" style="margin-bottom:12px">

      <input
        id="clientSearch"
        class="search"
        placeholder="Buscar cliente..."
        oninput="filterClients()"
      >

      <button
        class="primary"
        onclick="openClientForm()"
      >
        + Cliente
      </button>

    </div>

    <div id="clientsList" class="list">
      <div class="card muted">
        Carregando clientes...
      </div>
    </div>
  `;

  const { data, error } = await supabaseClient
    .from('clientes')
    .select('*')
    .order('nome', { ascending: true });

  const list = document.getElementById('clientsList');

  if(error){

    list.innerHTML = `
      <div class="card">
        <strong>Erro ao carregar clientes</strong>
        <p class="muted">
          ${error.message}
        </p>
      </div>
    `;

    return;
  }

  window.currentClients = data || [];

  if(!data || data.length === 0){

    list.innerHTML = `
      <div class="card">
        <strong>Nenhum cliente cadastrado</strong>
        <p class="muted">
          Clique em "+ Cliente" para cadastrar.
        </p>
      </div>
    `;

    return;
  }

  list.innerHTML = data.map(c => `
    <div class="card">
      <div class="product-name">
        ${c.nome || 'Sem nome'}
      </div>

      <div class="muted">
        ${c.telefone || 'Sem telefone'}
      </div>

      <div class="muted">
        ${c.endereço || 'Sem endereço'}
      </div>
    </div>
  `).join('');
}

function filterClients(){

  const input = document.getElementById('clientSearch');
  const list = document.getElementById('clientsList');

  if(!input || !list) return;

  const busca = input.value
    .trim()
    .toLowerCase();

  const clientes = window.currentClients || [];

  const filtrados = clientes.filter(c =>
    String(c.nome || '')
      .toLowerCase()
      .includes(busca) ||

    String(c.telefone || '')
      .toLowerCase()
      .includes(busca)
  );

  list.innerHTML = filtrados.length
    ? filtrados.map(c => `
        <div class="card">

          <div class="product-name">
            ${c.nome || 'Sem nome'}
          </div>

          <div class="muted">
            ${c.telefone || 'Sem telefone'}
          </div>

          <div class="muted">
            ${c.endereço || 'Sem endereço'}
          </div>

        </div>
      `).join('')

    : `
        <div class="card">
          <strong>Nenhum cliente encontrado</strong>
          <p class="muted">
            Não encontramos nenhum cliente com "${input.value}".
          </p>
        </div>
      `;
}
async function saveClient(){

  const nome = document.getElementById('clientName')?.value.trim();
  const telefone = document.getElementById('clientPhone')?.value.trim();
  const endereco = document.getElementById('clientAddress')?.value.trim();

  if(!nome){

    alert('Informe o nome do cliente.');
    return;
  }

  const { error } = await supabaseClient
    .from('clientes')
    .insert({
      nome: nome,
      telefone: telefone || null,
      endereço: endereco || null
    });

  if(error){

    console.error(
      'ERRO AO CADASTRAR CLIENTE:',
      error
    );

    alert(
      'Não foi possível cadastrar o cliente:\n\n' +
      error.message
    );

    return;
  }

  alert('Cliente cadastrado com sucesso!');

  await renderClients(
    document.getElementById('content')
  );
}
