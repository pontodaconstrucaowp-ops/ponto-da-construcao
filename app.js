const SUPABASE_URL = 'https://ifcdfydbkrpdcbtiqysc.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_InDtslnIkU5kvL0-OtzH7g_51jxEKwh';

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
// Ocultar a tela de login enquanto a sessão é verificada
document.getElementById('loginScreen')?.classList.add('hidden');

const state = {
  page: 'home',
  user: null,
  cart: [],
  selectedClient: null,
  saleDiscount: 0,
  cartOpen: false,
  products: [],
  clients: [],
  deliveries: []
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
function toggleUserMenu() {

  const menu = document.getElementById('userMenu');

  if (!menu) {
    console.error('Menu do usuário não encontrado.');
    return;
  }

  menu.classList.toggle('hidden');

}

async function restaurarSessao() {

  const telaLogin = document.getElementById('loginScreen');
  const aplicativo = document.getElementById('app');

  // Evitar mostrar o login enquanto verificamos a sessão
  const mostrarLogin = () => {
    state.user = null;
    aplicativo?.classList.add('hidden');
    telaLogin?.classList.remove('hidden');
    document.documentElement.classList.remove('verificando-sessao');
  };

  try {

    const { data: sessao, error: erroSessao } =
      await supabaseClient.auth.getSession();

    if (erroSessao) {
      throw erroSessao;
    }

    if (!sessao?.session) {
      mostrarLogin();
      return;
    }

    // Validar a autenticação no Supabase
    const { data: autenticacao, error: erroUsuario } =
      await supabaseClient.auth.getUser();

    if (erroUsuario || !autenticacao?.user) {
      mostrarLogin();
      return;
    }

    // Consultar o cadastro do usuário
    const { data: usuario, error: erroCadastro } =
      await supabaseClient
        .from('usuarios')
        .select('*')
        .eq('id', autenticacao.user.id)
        .maybeSingle();

    if (erroCadastro) {
      throw erroCadastro;
    }

    // Impedir acesso de usuários inexistentes ou inativos
    if (!usuario || !usuario.ativo) {
      mostrarLogin();
      return;
    }

    // Restaurar o usuário autenticado
    state.user = usuario;

    const nomeUsuario = document.getElementById('loggedUser');

    if (nomeUsuario) {
      nomeUsuario.textContent = usuario.nome || '';
    }

    // Mostrar o aplicativo
    telaLogin?.classList.add('hidden');
    aplicativo?.classList.remove('hidden');

    // Direcionar para a página permitida
    if (usuario.tipo === 'entregador') {
      navigate('deliveries');
    } else {
      navigate('home');
    }

    // Liberar a visualização depois da restauração
    document.documentElement.classList.remove('verificando-sessao');

  } catch (erro) {

    console.error('Erro ao restaurar sessão:', erro);

    mostrarLogin();

  }

}
async function logout() {

  const confirmou = window.confirm(
    'Deseja realmente sair do sistema?'
  );

  if (!confirmou) {
    return;
  }

  try {

    // Encerrar a sessão de autenticação
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
      throw error;
    }

    // Limpar os dados da sessão no aplicativo
    state.user = null;
    state.cart = [];
    state.selectedClient = null;
    state.saleDiscount = 0;
    state.cartOpen = false;
    state.page = 'home';

    window.salePayment = null;
    window.saleType = null;
    window.saleProducts = [];

    // Fechar o menu do usuário, caso esteja aberto
    document.getElementById('userMenu')
      ?.classList.add('hidden');

    // Ocultar o aplicativo
    document.getElementById('app')
      ?.classList.add('hidden');

    // Exibir a tela de login
    document.getElementById('loginScreen')
      ?.classList.remove('hidden');

    // Limpar o campo de senha
    const campoSenha = document.getElementById('loginPass');

    if (campoSenha) {
      campoSenha.value = '';
    }

  } catch (erro) {

    console.error('Erro ao encerrar sessão:', erro);

    alert(
      'Não foi possível encerrar a sessão. ' +
      'Verifique sua conexão e tente novamente.'
    );

  }

}



function navigate(page) {

  const ehAdministrador =
    state.user?.tipo === 'admin' ||
    state.user?.tipo === 'administrador';

  // =====================================
  // RESTRIÇÃO PARA ENTREGADORES
  // =====================================

  if (state.user?.tipo === 'entregador') {

    const permitidas = ['deliveries'];

    if (!permitidas.includes(page)) {
      page = 'deliveries';
    }

  }

  // =====================================
  // RESTRIÇÃO FINANCEIRA
  // =====================================

  if (page === 'receivables' && !ehAdministrador) {

    alert(
      'Acesso permitido somente aos administradores.'
    );

    page = 'more';

  }

  // =====================================
  // PÁGINA ATUAL
  // =====================================

  state.page = page;

  // =====================================
  // MENU INFERIOR
  // =====================================

  document
    .querySelectorAll('.bottom-nav button')
    .forEach(b => {

      b.classList.toggle(
        'active',
        b.dataset.page === page
      );

    });

  // =====================================
  // TÍTULOS DAS PÁGINAS
  // =====================================

  const titles = {
    home: 'Início',
    sales: 'Nova venda',
    products: 'Estoque',
    deliveries: 'Entregas',
    more: 'Mais opções',
    observations: 'Observações',
    clients: 'Clientes',
    receivables: 'Contas a receber',
    cash: 'Caixa',
    reports: 'Relatórios',
    settings: 'Configurações'
  };

  document.getElementById('pageTitle').textContent =
    titles[page] || 'Ponto da Construção';

  // =====================================
  // ÁREA DE CONTEÚDO
  // =====================================

  const content =
    document.getElementById('content');

  // =====================================
  // CARREGAMENTO DAS PÁGINAS
  // =====================================

  if (page === 'home') {

    renderHome(content);

  } else if (page === 'sales') {

    renderSales(content);

  } else if (page === 'products') {

    renderProducts(content);

  } else if (page === 'deliveries') {

    renderDeliveries(content);

  } else if (page === 'more') {

    renderMore(content);

  } else if (page === 'clients') {

    renderClients(content);

  } else if (page === 'receivables') {

    // CONSULTA REAL DAS CONTAS A RECEBER
    renderReceivables(content);

  } else if (page === 'cash') {

    renderCash(content);

  } else if (page === 'reports') {

    renderReports(content);

} else if (page === 'settings') {

  renderSettings(content);

} else if (page === 'observations') {

  const ehAdministrador =
    state.user?.tipo === 'admin' ||
    state.user?.tipo === 'administrador';

  if (!ehAdministrador) {
    content.innerHTML = `
      <div class="card">
        <h2>Acesso restrito</h2>
        <p class="muted">
          Somente administradores podem acessar observações.
        </p>
      </div>
    `;
  } else {
    renderObservations(content);
  }

}

  // =====================================
  // VOLTAR AO TOPO
  // =====================================

  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });

}

function money(v){
  return v.toLocaleString(
    'pt-BR',
    {
      style:'currency',
      currency:'BRL'
    }
  );
}







async function renderHome(el) {

  if (!el) return;

  const ehAdministrador =
    state.user?.tipo === 'admin' ||
    state.user?.tipo === 'administrador';

  if (!ehAdministrador) {
    el.innerHTML = `
      <div class="card">
        <h2>Acesso restrito</h2>
        <p class="muted">
          O Dashboard é exclusivo dos administradores.
        </p>
      </div>
    `;
    return;
  }

  const escapar = valor =>
    String(valor ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c]));

  // =====================================
  // DATAS NO HORÁRIO LOCAL
  // =====================================

  const agora = new Date();

  const ano = agora.getFullYear();
  const mes = agora.getMonth();
  const dia = agora.getDate();

  const inicioHoje = new Date(ano, mes, dia);
  const inicioAmanha = new Date(ano, mes, dia + 1);

  const inicioMes = new Date(ano, mes, 1);
  const inicioProximoMes = new Date(ano, mes + 1, 1);

  const inicioAno = new Date(ano, 0, 1);
  const inicioProximoAno = new Date(ano + 1, 0, 1);

  // =====================================
  // ESTRUTURA DO DASHBOARD
  // =====================================

  el.innerHTML = `
    <div class="section-title">
      <h2>📊 Visão geral</h2>
    </div>


    <div class="grid stats">

      <div class="card stat">
        <div class="label">Vendas de hoje</div>
        <div class="value" id="dashVendasHoje">
          Carregando...
        </div>
      </div>

      <div class="card stat">
        <div class="label">Vendas do mês</div>
        <div class="value" id="dashVendasMes">
          Carregando...
        </div>
      </div>

      <div class="card stat">
        <div class="label">A receber</div>
        <div class="value" id="dashAReceber">
          Carregando...
        </div>
      </div>

      <div class="card stat">
        <div class="label">Faturamento anual</div>
        <div class="value" id="dashFaturamentoAno">
          Carregando...
        </div>
        <small class="muted">
          Vendas concluídas em ${ano}
        </small>
      </div>

      <div class="card stat">
        <div class="label">Entregas pendentes</div>
        <div class="value" id="dashEntregasPendentes">
          Carregando...
        </div>
        <small class="muted">
          Aguardando ou em rota
        </small>
      </div>

      <div class="card stat">
        <div class="label">Estoque baixo</div>
        <div class="value" id="dashEstoqueBaixo">
          Carregando...
        </div>
        <small class="muted">
          Produtos no mínimo ou abaixo dele
        </small>
      </div>

    </div>



    <div class="section-title">
      <h2>Ações rápidas</h2>
    </div>

    <div class="grid quick">

      <button onclick="navigate('sales')">
        <strong>＋ Nova venda</strong>
        <span class="muted">Registrar um pedido</span>
      </button>

      <button onclick="navigate('clients')">
        <strong>👤 Clientes</strong>
        <span class="muted">Cadastrar e consultar</span>
      </button>

      <button onclick="navigate('deliveries')">
        <strong>⇢ Entregas</strong>
        <span class="muted">Organizar a fila</span>
      </button>

      <button onclick="navigate('products')">
        <strong>▦ Estoque</strong>
        <span class="muted">Produtos e preços</span>
      </button>

    </div>

    <div class="section-title">
      <h2>🚚 Próximas entregas</h2>

      <button
        class="secondary"
        onclick="navigate('deliveries')"
      >
        Ver todas
      </button>
    </div>

    <div class="card">
      <div id="dashProximasEntregas">
        <p class="muted">
          Consultando fila de entregas...
        </p>
      </div>
    </div>

    <div class="section-title">
      <h2>📦 Materiais que precisam de atenção</h2>
    </div>

    <div class="card">
      <div id="dashListaEstoqueBaixo">
        <p class="muted">
          Consultando estoque...
        </p>
      </div>
    </div>
  `;

  // =====================================
  // CONSULTA PAGINADA
  // =====================================

  async function consultarTodos(
    tabela,
    campos,
    configurar = consulta => consulta
  ) {

    const resultado = [];
    const tamanhoPagina = 1000;
    let pagina = 0;

    while (true) {

      const inicio = pagina * tamanhoPagina;
      const fim = inicio + tamanhoPagina - 1;

      let consulta = supabaseClient
        .from(tabela)
        .select(campos);

      consulta = configurar(consulta);

      const { data, error } = await consulta
        .range(inicio, fim);

      if (error) throw error;

      const lote = data || [];

      resultado.push(...lote);

      if (lote.length < tamanhoPagina) {
        break;
      }

      pagina++;
    }

    return resultado;
  }

  // =====================================
  // VERIFICAR PÁGINA ATUAL
  // =====================================

  const paginaAtual = () =>
    state.page === 'home' &&
    el.isConnected &&
    el.querySelector('#dashEstoqueBaixo') !== null;
    // =====================================
  // CONSULTAS PARALELAS DO DASHBOARD
  // =====================================

  const consultaVendas = consultarTodos(
    'vendas',
    'id,data,valor_total,status',
    consulta => consulta
      .gte('data', inicioAno.toISOString())
      .lt('data', inicioProximoAno.toISOString())
      .order('data', { ascending: true })
      .order('id', { ascending: true })
  );

  const consultaContas = consultarTodos(
    'contas_receber',
    'id,valor_original,valor_recebido,status',
    consulta => consulta
      .in('status', ['pendente', 'parcial'])
      .order('id', { ascending: true })
  );

  const consultaEntregas = consultarTodos(
    'entregas',
    `
      id,
      venda_id,
      status,
      prioridade,
      posicao_fila,
      endereço,
      created_at,
      vendas (
        id,
        valor_total,
        clientes (
          nome,
          endereço
        )
      )
    `,
    consulta => consulta
      .in('status', ['pendente', 'em_rota'])
      .order('posicao_fila', {
        ascending: true,
        nullsFirst: false
      })
      .order('id', { ascending: true })
  );

  const consultaProdutos = consultarTodos(
    'produtos',
    `id,nome,unidade,estoque,
     estoque_minimo,controla_estoque,ativo`,
    consulta => consulta
      .eq('ativo', true)
      .eq('controla_estoque', true)
      .order('id', { ascending: true })
  );
  // Acompanhar todas as consultas paralelas,
  // inclusive quando alguma apresentar erro.
  Promise.allSettled([
    consultaVendas,
    consultaContas,
    consultaEntregas,
    consultaProdutos
  ]);
  
  // =====================================
  // VENDAS E FATURAMENTO ANUAL
  // =====================================

  try {

const vendas = await consultaVendas;

    let totalHoje = 0;
    let totalMes = 0;
    let totalAno = 0;

    let dadosIncompletosHoje = false;
    let dadosIncompletosMes = false;
    let dadosIncompletosAno = false;

    for (const venda of vendas) {

      if (venda.status !== 'concluida') {
        continue;
      }

      const dataVenda = new Date(venda.data);

      if (Number.isNaN(dataVenda.getTime())) {
        dadosIncompletosAno = true;
        continue;
      }

      const ehHoje =
        dataVenda >= inicioHoje &&
        dataVenda < inicioAmanha;

      const ehMes =
        dataVenda >= inicioMes &&
        dataVenda < inicioProximoMes;

      const ehAno =
        dataVenda >= inicioAno &&
        dataVenda < inicioProximoAno;

      const valor = Number(venda.valor_total);

      if (
        venda.valor_total === null ||
        !Number.isFinite(valor) ||
        valor < 0
      ) {

        if (ehHoje) {
          dadosIncompletosHoje = true;
        }

        if (ehMes) {
          dadosIncompletosMes = true;
        }

        if (ehAno) {
          dadosIncompletosAno = true;
        }

        continue;
      }

      if (ehAno) {
        totalAno += valor;
      }

      if (ehMes) {
        totalMes += valor;
      }

      if (ehHoje) {
        totalHoje += valor;
      }
    }

    if (!paginaAtual()) return;

    const campoHoje =
      el.querySelector('#dashVendasHoje');

    const campoMes =
      el.querySelector('#dashVendasMes');

    const campoAno =
      el.querySelector('#dashFaturamentoAno');

    if (campoHoje) {
      campoHoje.textContent = dadosIncompletosHoje
        ? 'Incompleto'
        : money(totalHoje);
    }

    if (campoMes) {
      campoMes.textContent = dadosIncompletosMes
        ? 'Incompleto'
        : money(totalMes);
    }

    if (campoAno) {
      campoAno.textContent = dadosIncompletosAno
        ? 'Incompleto'
        : money(totalAno);
    }

  } catch (erro) {

    console.error(
      'Erro ao carregar faturamento do Dashboard:',
      erro
    );

    if (!paginaAtual()) return;

    el.querySelector('#dashVendasHoje').textContent =
      'Indisponível';

    el.querySelector('#dashVendasMes').textContent =
      'Indisponível';

    el.querySelector('#dashFaturamentoAno').textContent =
      'Indisponível';
  }

  // =====================================
  // CONTAS A RECEBER
  // =====================================

  try {

const contas = await consultaContas;

    let totalAReceber = 0;

    for (const conta of contas) {

      const valorOriginal =
        Number(conta.valor_original);

      const valorRecebido =
        Number(conta.valor_recebido);

      if (
        !Number.isFinite(valorOriginal) ||
        !Number.isFinite(valorRecebido)
      ) {
        continue;
      }

      totalAReceber += Math.max(
        0,
        valorOriginal - valorRecebido
      );
    }

    if (!paginaAtual()) return;

    el.querySelector('#dashAReceber').textContent =
      money(totalAReceber);

  } catch (erro) {

    console.error(
      'Erro ao carregar contas a receber:',
      erro
    );

    if (!paginaAtual()) return;

    el.querySelector('#dashAReceber').textContent =
      'Indisponível';
  }

  // =====================================
  // ENTREGAS PENDENTES — DADOS REAIS
  // =====================================

  try {

const entregas = await consultaEntregas;

    if (!paginaAtual()) return;

    const campoQuantidade =
      el.querySelector('#dashEntregasPendentes');

    const campoLista =
      el.querySelector('#dashProximasEntregas');

    campoQuantidade.textContent =
      String(entregas.length);

    // =====================================
    // NENHUMA ENTREGA PENDENTE
    // =====================================

    if (entregas.length === 0) {

      campoLista.innerHTML = `
        <p
          style="
            color:#166534;
            font-weight:600;
            margin-bottom:8px;
          "
        >
          ✅ Nenhuma entrega pendente.
        </p>

        <p class="muted">
          Não existem entregas aguardando
          ou em rota neste momento.
        </p>
      `;

    } else {

      // =====================================
      // MOSTRAR AS PRIMEIRAS CINCO
      // =====================================

      const proximas = entregas.slice(0, 5);

      campoLista.innerHTML = `

        <p
          class="muted"
          style="margin-bottom:14px"
        >
          ${entregas.length}
          entrega(s) aguardando
          ou em andamento.
        </p>

        ${proximas.map(entrega => {

          const venda = entrega.vendas;
          const cliente = venda?.clientes;

          const nomeCliente = escapar(
            cliente?.nome || 'Cliente não informado'
          );

          const endereco = escapar(
            entrega.endereço ||
            cliente?.endereço ||
            'Endereço não informado'
          );

          const emRota =
            entrega.status === 'em_rota';

          const statusTexto = emRota
            ? '🚚 Em rota'
            : '⏳ Pendente';

          const statusCor = emRota
            ? '#1d4ed8'
            : '#b45309';

          const valorVenda =
            Number(venda?.valor_total);

          const valorTexto =
            venda?.valor_total != null &&
            Number.isFinite(valorVenda)
              ? money(valorVenda)
              : 'Valor não informado';

          const prioridadeTexto =
            entrega.prioridade === true
              ? '🔴 Prioritária'
              : '';

          return `

            <div
              style="
                border:1px solid #e2e8f0;
                border-radius:10px;
                padding:14px;
                margin-bottom:10px;
              "
            >

              <div
                class="row"
                style="
                  align-items:flex-start;
                  gap:10px;
                "
              >

                <strong>
                  #${escapar(entrega.id)}
                  · ${nomeCliente}
                </strong>

                <span
                  style="
                    color:${statusCor};
                    font-size:12px;
                    font-weight:700;
                  "
                >
                  ${statusTexto}
                </span>

              </div>

              <p
                class="muted"
                style="margin-top:8px"
              >
                📍 ${endereco}
              </p>

              ${prioridadeTexto ? `
                <p
                  style="
                    color:#b91c1c;
                    font-size:12px;
                    font-weight:700;
                    margin-top:6px;
                  "
                >
                  ${prioridadeTexto}
                </p>
              ` : ''}

              <div
                class="row"
                style="
                  margin-top:10px;
                  gap:10px;
                "
              >

                <strong>
                  ${valorTexto}
                </strong>

                <span class="muted">
                  ${entrega.posicao_fila != null
                    ? 'Posição ' +
                      escapar(entrega.posicao_fila)
                    : 'Sem posição definida'}
                </span>

              </div>

            </div>
          `;

        }).join('')}

        <button
          type="button"
          class="secondary"
          onclick="navigate('deliveries')"
          style="margin-top:8px"
        >
          🚚 Abrir fila de entregas
        </button>

      `;
    }

  } catch (erro) {

    console.error(
      'Erro ao carregar entregas do Dashboard:',
      erro
    );

    if (!paginaAtual()) return;

    el.querySelector('#dashEntregasPendentes')
      .textContent = 'Indisponível';

    el.querySelector('#dashProximasEntregas')
      .innerHTML = `
        <p class="muted">
Não foi possível consultar as entregas.
Tente novamente em alguns instantes.
        </p>
      `;
  }

  // =====================================
  // ESTOQUE BAIXO — DADOS REAIS
  // =====================================

  try {

const produtos = await consultaProdutos;
    const materiaisBaixos = produtos.filter(produto => {

      if (
        produto.estoque === null ||
        produto.estoque === undefined ||
        produto.estoque_minimo === null ||
        produto.estoque_minimo === undefined
      ) {
        return false;
      }

      const estoque = Number(produto.estoque);
      const minimo = Number(produto.estoque_minimo);

      return (
        Number.isFinite(estoque) &&
        Number.isFinite(minimo) &&
        minimo >= 0 &&
        estoque <= minimo
      );
    });

    materiaisBaixos.sort((a, b) => {

      const estoqueA = Number(a.estoque);
      const estoqueB = Number(b.estoque);

      const esgotadoA = estoqueA <= 0 ? 0 : 1;
      const esgotadoB = estoqueB <= 0 ? 0 : 1;

      if (esgotadoA !== esgotadoB) {
        return esgotadoA - esgotadoB;
      }

      return String(a.nome || '').localeCompare(
        String(b.nome || ''),
        'pt-BR'
      );
    });

    if (!paginaAtual()) return;

    const campoQuantidade =
      el.querySelector('#dashEstoqueBaixo');

    const campoLista =
      el.querySelector('#dashListaEstoqueBaixo');

    campoQuantidade.textContent =
      String(materiaisBaixos.length);

    if (!materiaisBaixos.length) {

      campoLista.innerHTML = `
        <p style="color:#166534;font-weight:600">
          ✅ Nenhum material com estoque
          no mínimo ou abaixo dele.
        </p>

        <p class="muted" style="font-size:12px">
          Considerando os produtos ativos
          com controle de estoque e
          estoque mínimo informado.
        </p>
      `;

      return;
    }

    campoLista.innerHTML = `
      <p class="muted" style="margin-bottom:12px">
        ${materiaisBaixos.length}
        ${materiaisBaixos.length === 1
          ? 'material precisa'
          : 'materiais precisam'}
        de atenção.
      </p>

      ${materiaisBaixos.map(produto => {

        const estoque = Number(produto.estoque);
        const minimo = Number(produto.estoque_minimo);

        const esgotado = estoque <= 0;

        const quantidade = valor =>
          Number(valor).toLocaleString('pt-BR', {
            maximumFractionDigits: 3
          });

        const unidade = escapar(
          produto.unidade || 'unidade'
        );

        return `
          <div style="
            border:1px solid #e2e8f0;
            border-radius:10px;
            padding:12px;
            margin-bottom:10px;
          ">

            <strong>
              ${escapar(produto.nome)}
            </strong>

            <p style="
              margin:8px 0 4px;
              color:${esgotado ? '#b91c1c' : '#b45309'};
              font-weight:700;
            ">
              ${esgotado
                ? '🔴 Esgotado'
                : '🟠 Estoque baixo'}
            </p>

            <p class="muted">
              Disponível:
              <strong>
                ${quantidade(estoque)} ${unidade}
              </strong>
            </p>

            <p class="muted">
              Estoque mínimo:
              <strong>
                ${quantidade(minimo)} ${unidade}
              </strong>
            </p>

          </div>
        `;
      }).join('')}

      <button
        type="button"
        class="secondary"
        onclick="navigate('products')"
        style="margin-top:8px"
      >
        Ver estoque completo
      </button>
    `;

  } catch (erro) {

    console.error(
      'Erro ao consultar estoque baixo:',
      erro
    );

    if (!paginaAtual()) return;

    el.querySelector('#dashEstoqueBaixo').textContent =
      'Indisponível';

    el.querySelector('#dashListaEstoqueBaixo').innerHTML = `
      <p class="muted">
Não foi possível consultar o estoque.
Tente novamente em alguns instantes.
      </p>
    `;
  }
}


async function renderSales(el) {

  const carrinhoEstavaAberto =
    document.getElementById('pcCarrinhoPainel')
      ?.dataset.aberto === 'true';

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

    <!-- TÍTULO E PESQUISA MAIS PRÓXIMOS -->
    <div
      class="section-title"
      style="
        margin:16px 0 8px !important;
        padding:0 !important;
        min-height:0 !important;
      "
    >
      <h2 style="margin:0">
        Materiais
      </h2>
    </div>

    <div
      id="saleProducts"
      style="
        margin:0 !important;
        padding:0 !important;
        display:block;
      "
    >

      <input
        id="saleProductSearch"
        class="search"
        placeholder="Pesquisar material..."
        oninput="pcMostrarProdutos()"
        style="
          display:block;
          margin:0 0 12px !important;
        "
      >

      <div id="saleProductItems">
        Carregando materiais...
      </div>

    </div>

    <!-- Espaço para os últimos materiais -->
    <div
      id="pcEspacoCarrinho"
      aria-hidden="true"
      style="height:100px;pointer-events:none"
    ></div>

    <!-- Fundo escuro -->
    <div
      id="pcCarrinhoFundo"
      onclick="pcAlternarCarrinho(false)"
      style="
        display:none;
        position:fixed;
        inset:0;
        background:rgba(0,0,0,0.45);
        z-index:9990;
      "
    ></div>

    <!-- PAINEL DO CARRINHO -->
    <div
      id="pcCarrinhoPainel"
      data-aberto="false"
      style="
        display:none;
        position:fixed;
        left:0;
        right:0;
        bottom:0;
        z-index:9992;
        background:#fff;
        color:#222;
        border-radius:18px 18px 0 0;
        box-shadow:0 -8px 30px rgba(0,0,0,0.18);
        max-height:60vh;
        overflow-y:auto;
        overscroll-behavior:contain;
        padding:18px;
        box-sizing:border-box;
      "
    >

      <div
        style="
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:12px;
          margin-bottom:18px;
        "
      >

        <h2 style="margin:0;font-size:20px">
          🛒 Meu carrinho
        </h2>

        <button
          type="button"
          class="secondary"
          onclick="pcAlternarCarrinho(false)"
          style="
            padding:8px 12px;
            min-width:42px;
          "
        >
          ✕
        </button>

      </div>

      <div id="pcResumoItens"></div>

      <div
        class="field"
        style="margin-top:18px"
      >

        <label for="saleDiscount">
          Desconto em reais
        </label>

        <input
          id="saleDiscount"
          type="number"
          min="0"
          step="0.01"
          value="${Number(state.saleDiscount) || 0}"
          oninput="pcAtualizarResumo()"
        >

      </div>

      <div
        class="row"
        style="
          margin-top:18px;
          padding:12px 0;
          border-top:1px solid #ddd;
        "
      >

        <strong>Total final</strong>

        <strong
          id="pcTotalFinal"
          class="total"
        ></strong>

      </div>

      <!-- BOTÃO DE ORÇAMENTO ADAPTADO AO CELULAR -->
      <button
        type="button"
        class="secondary"
        onclick="pcImprimirOrcamento()"
        style="
          display:block;
          width:100%;
          min-height:48px;
          margin:0 0 12px;
          border:1px solid #0b408e;
          color:#0b408e;
          font-weight:700;
          border-radius:10px;
        "
      >
        🖨️ Imprimir orçamento
      </button>

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

    <!-- BARRA FIXA DO CARRINHO -->
    <div
      id="pcCarrinhoBarra"
      role="button"
      tabindex="0"
      aria-label="Abrir ou fechar carrinho"
      onclick="pcAlternarCarrinho()"
      onkeydown="
        if(event.key === 'Enter' || event.key === ' '){
          event.preventDefault();
          pcAlternarCarrinho();
        }
      "
      style="
        position:fixed;
        left:0;
        right:0;
        bottom:0;
        z-index:9993;
        background:#166534;
        color:white;
        padding:12px 18px;
        box-shadow:0 -4px 15px rgba(0,0,0,0.16);
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:12px;
        cursor:pointer;
        box-sizing:border-box;
      "
    >

      <div>

        <strong style="font-size:15px">
          🛒 Meu carrinho
        </strong>

        <div
          id="pcCarrinhoQuantidade"
          style="
            font-size:12px;
            opacity:0.9;
            margin-top:3px;
          "
        >
          Nenhum material
        </div>

      </div>

      <div style="text-align:right">

        <strong
          id="pcCarrinhoValor"
          style="font-size:18px"
        >
          R$ 0,00
        </strong>

        <div
          id="pcCarrinhoSeta"
          style="
            font-size:12px;
            margin-top:3px;
          "
        >
          ▲ Abrir
        </div>

      </div>

    </div>
  `;

  // =====================================
  // POSICIONAMENTO DO CARRINHO
  // =====================================

  const barra =
    document.getElementById('pcCarrinhoBarra');

  const painel =
    document.getElementById('pcCarrinhoPainel');

  const fundo =
    document.getElementById('pcCarrinhoFundo');

  const espaco =
    document.getElementById('pcEspacoCarrinho');

  const seta =
    document.getElementById('pcCarrinhoSeta');

  const menuInferior =
    document.querySelector('.bottom-nav');

  function ajustarPosicaoCarrinho() {

    if (!barra?.isConnected) return;

    let alturaMenu = 0;

    if (menuInferior) {

      const estiloMenu =
        window.getComputedStyle(menuInferior);

      if (
        estiloMenu.display !== 'none' &&
        estiloMenu.visibility !== 'hidden'
      ) {

        const retangulo =
          menuInferior.getBoundingClientRect();

        if (
          retangulo.width > 0 &&
          retangulo.height > 0
        ) {

          alturaMenu = Math.max(
            0,
            window.innerHeight - retangulo.top
          );

          alturaMenu = Math.min(
            alturaMenu,
            window.innerHeight
          );

        }

      }

    }

    barra.style.bottom = alturaMenu + 'px';

    const alturaBarra =
      barra.getBoundingClientRect().height;

    painel.style.bottom =
      (alturaMenu + alturaBarra) + 'px';

    const alturaDisponivel = Math.max(
      120,
      window.innerHeight -
      alturaMenu -
      alturaBarra -
      24
    );

    painel.style.maxHeight =
      Math.min(
        alturaDisponivel,
        window.innerHeight * 0.65
      ) + 'px';

    if (espaco) {
      espaco.style.height =
        (alturaBarra + 24) + 'px';
    }

  }

  window.pcAjustarPosicaoCarrinho =
    ajustarPosicaoCarrinho;

  if (window.pcCarrinhoResizeHandler) {

    window.removeEventListener(
      'resize',
      window.pcCarrinhoResizeHandler
    );

  }

  window.pcCarrinhoResizeHandler =
    ajustarPosicaoCarrinho;

  window.addEventListener(
    'resize',
    window.pcCarrinhoResizeHandler
  );

  if (window.pcCarrinhoResizeObserver) {
    window.pcCarrinhoResizeObserver.disconnect();
  }

  if (
    menuInferior &&
    typeof ResizeObserver !== 'undefined'
  ) {

    window.pcCarrinhoResizeObserver =
      new ResizeObserver(
        ajustarPosicaoCarrinho
      );

    window.pcCarrinhoResizeObserver.observe(
      menuInferior
    );

  }

  // =====================================
  // ABRIR E FECHAR O CARRINHO
  // =====================================

  window.pcAlternarCarrinho = function(abrir) {

    if (!painel?.isConnected) return;

    const estaAberto =
      painel.dataset.aberto === 'true';

    const deveAbrir =
      typeof abrir === 'boolean'
        ? abrir
        : !estaAberto;

    painel.dataset.aberto =
      String(deveAbrir);

    painel.style.display =
      deveAbrir ? 'block' : 'none';

    fundo.style.display =
      deveAbrir ? 'block' : 'none';

    if (seta) {

      seta.textContent =
        deveAbrir ? '▼ Fechar' : '▲ Abrir';

    }

    ajustarPosicaoCarrinho();

  };

  // =====================================
  // QUANTIDADE E VALOR DO CARRINHO
  // =====================================

  window.pcAtualizarBarraCarrinho = function() {

    const quantidade =
      document.getElementById(
        'pcCarrinhoQuantidade'
      );

    const valor =
      document.getElementById(
        'pcCarrinhoValor'
      );

    if (!quantidade || !valor) return;

    const quantidadeMateriais =
      state.cart.length;

    quantidade.textContent =
      quantidadeMateriais === 0
        ? 'Nenhum material'
        : quantidadeMateriais === 1
          ? '1 material no pedido'
          : `${quantidadeMateriais} materiais no pedido`;

    const total = pcTotal();

    const desconto = Math.min(
      total,
      Math.max(
        0,
        Number(state.saleDiscount) || 0
      )
    );

    valor.textContent =
      money(total - desconto);

  };

  // =====================================
  // SINCRONIZAÇÃO DO RESUMO
  // =====================================

  if (window.pcCarrinhoMutationObserver) {
    window.pcCarrinhoMutationObserver.disconnect();
  }

  const resumo =
    document.getElementById('pcResumoItens');

  if (resumo) {

    window.pcCarrinhoMutationObserver =
      new MutationObserver(() => {

        if (!resumo.isConnected) return;

        pcAtualizarBarraCarrinho();

      });

    window.pcCarrinhoMutationObserver.observe(
      resumo,
      {
        childList: true,
        subtree: true
      }
    );

  }

  const descontoInput =
    document.getElementById('saleDiscount');

  if (descontoInput) {

    descontoInput.addEventListener(
      'input',
      pcAtualizarBarraCarrinho
    );

  }

  // =====================================
  // CLIENTE E RESUMO
  // =====================================

  if (state.selectedClient) {
    selectSaleClient(state.selectedClient);
  }

  pcAtualizarResumo();
  pcAtualizarBarraCarrinho();
  ajustarPosicaoCarrinho();

  if (carrinhoEstavaAberto) {
    pcAlternarCarrinho(true);
  }

  // =====================================
  // CONSULTA DOS PRODUTOS
  // =====================================

  const lista =
    el.querySelector('#saleProductItems');

  const ehAdministrador =
    state.user?.tipo === 'admin' ||
    state.user?.tipo === 'administrador';

  const camposPublicos = [
    'id',
    'nome',
    'categoria',
    'unidade',
    'preco',
    'preco_avulso',
    'estoque',
    'estoque_minimo',
    'controla_estoque',
    'estoque_unificado',
    'ativo'
  ];

  const camposRevenda = [
    'custo_referencia',
    'frete_referencia',
    'margem_desejada',
    'fornecedor_referencia',
    'observacoes_revenda'
  ];

  const camposConsulta = ehAdministrador
    ? [...camposPublicos, ...camposRevenda]
    : camposPublicos;

  const { data, error } = await supabaseClient
    .from('produtos')
    .select(camposConsulta.join(','))
    .eq('ativo', true)
    .order('nome', { ascending: true });

  if (!lista.isConnected) return;

  if (error) {

    console.error(
      'Erro ao carregar produtos:',
      error
    );

    lista.textContent =
      'Não foi possível carregar: ' +
      error.message;

    return;

  }

  window.saleProducts = data || [];

  pcMostrarProdutos();

  ajustarPosicaoCarrinho();

}




function pcImprimirOrcamento() {

  // =====================================
  // VALIDAR CARRINHO
  // =====================================

  if (!Array.isArray(state.cart) || !state.cart.length) {
    alert('Adicione pelo menos um material ao orçamento.');
    return;
  }

  const totalMateriais = pcTotal();

  const descontoInformado = Number(
    document.getElementById('saleDiscount')?.value ??
    state.saleDiscount ??
    0
  );

  if (
    !Number.isFinite(descontoInformado) ||
    descontoInformado < 0
  ) {
    alert('Confira o desconto informado antes de imprimir.');
    return;
  }

  const desconto = Math.min(
    descontoInformado,
    totalMateriais
  );

  const totalFinal =
    Math.round((totalMateriais - desconto) * 100) / 100;

  const escapar = valor =>
    pcEscapar(String(valor ?? ''));

  const formatarQuantidade = valor =>
    Number(valor).toLocaleString('pt-BR', {
      maximumFractionDigits: 3
    });

  const nomeCliente = state.selectedClient
    ? (
        document.getElementById('saleClient')
          ?.value?.trim() || 'Cliente'
      )
    : 'Não informado';

  // =====================================
  // PREPARAR MATERIAIS
  // =====================================

  const itens = [];

  for (const item of state.cart) {

    const quantidade = Number(item.qty);
    const preco = Number(item.price);

    if (
      !Number.isFinite(quantidade) ||
      quantidade <= 0 ||
      !Number.isFinite(preco) ||
      preco < 0
    ) {
      alert(
        'Existe um material com quantidade ou preço inválido.'
      );
      return;
    }

    itens.push({
      nome: String(item.name || 'Material'),
      unidade: String(item.unit || 'unidade'),
      quantidade,

      // Apenas o total da linha será exibido.
      subtotal:
        Math.round(quantidade * preco * 100) / 100
    });
  }

  // =====================================
  // DADOS DA EMPRESA
  // =====================================

  const logoEmpresa = new URL(
    'logo-ponto-construcao.png',
    document.baseURI
  ).href;

  const telefoneEmpresa = '(91) 98894-2001';

  // Abrir imediatamente ajuda a evitar
  // bloqueio de pop-ups no celular.
  const janela = window.open('', '_blank');

  if (!janela) {
    alert(
      'Permita pop-ups para este site e tente imprimir novamente.'
    );
    return;
  }

  // =====================================
  // LINHAS DA TABELA
  // SEM PREÇO UNITÁRIO
  // =====================================

  const linhas = itens.map(item => `
    <tr>

      <td class="material">
        ${escapar(item.nome)}

        <small>
          ${escapar(item.unidade)}
        </small>
      </td>

      <td class="numero">
        ${formatarQuantidade(item.quantidade)}
      </td>

      <td class="numero">
        ${money(item.subtotal)}
      </td>

    </tr>
  `).join('');

  // =====================================
  // DOCUMENTO DO ORÇAMENTO
  // =====================================

  const html = `<!DOCTYPE html>
<html lang="pt-BR">

<head>
<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width, initial-scale=1"
>

<title>Orçamento - Ponto da Construção</title>

<style>

  * {
    box-sizing: border-box;
  }

  body {
    font: 14px Arial, sans-serif;
    color: #172033;
    margin: 0;
    background: #f3f5f8;
  }

  main {
    max-width: 800px;
    margin: 20px auto;
    background: white;
    padding: 25px;
    border-radius: 10px;
  }

  /* CABEÇALHO */

  header {
    display: flex;
    align-items: center;
    gap: 16px;
    border-bottom: 2px solid #123f87;
    padding-bottom: 16px;
    margin-bottom: 18px;
  }

  .logo {
    width: 90px;
    max-height: 95px;
    object-fit: contain;
    flex-shrink: 0;
  }

  .empresa {
    min-width: 0;
  }

  h1 {
    margin: 0;
    color: #123f87;
    font-size: 23px;
  }

  .sub {
    color: #64748b;
    margin-top: 5px;
  }

  .telefone {
    margin-top: 7px;
    font-size: 14px;
    font-weight: bold;
    color: #172033;
  }

  /* DADOS DO CLIENTE */

  .dados {
    line-height: 1.7;
    margin: 14px 0 20px;
  }

  /* TABELA */

  table {
    border-collapse: collapse;
    width: 100%;
    font-size: 12px;
  }

  th, td {
    padding: 10px 6px;
    border-bottom: 1px solid #dbe2ea;
    vertical-align: top;
  }

  th {
    text-align: left;
    background: #eef3fb;
  }

  .material {
    width: 60%;
  }

  td small {
    display: block;
    color: #64748b;
    margin-top: 3px;
  }

  .numero {
    text-align: right;
    white-space: nowrap;
  }

  /* TOTAIS */

  .totais {
    margin: 20px 0 0 auto;
    max-width: 350px;
    line-height: 2;
  }

  .totais div {
    display: flex;
    justify-content: space-between;
    gap: 15px;
  }

  .final {
    border-top: 2px solid #123f87;
    font-size: 18px;
    font-weight: bold;
    color: #123f87;
  }

  .aviso {
    margin-top: 25px;
    color: #64748b;
    font-size: 12px;
  }

  /* BOTÃO DE IMPRESSÃO */

  .acoes {
    display: flex;
    gap: 10px;
    margin: 15px auto;
    max-width: 800px;
    padding: 0 10px;
  }

  button {
    background: #123f87;
    color: white;
    border: 0;
    border-radius: 8px;
    padding: 14px 20px;
    font-weight: bold;
    font-size: 15px;
    cursor: pointer;
  }

  /* CELULAR */

  @media (max-width: 600px) {

    main {
      margin: 0;
      padding: 15px;
      border-radius: 0;
    }

    header {
      gap: 10px;
    }

    .logo {
      width: 65px;
      max-height: 75px;
    }

    h1 {
      font-size: 18px;
    }

    .telefone {
      font-size: 12px;
    }

    table {
      font-size: 10px;
    }

    th, td {
      padding: 8px 3px;
    }

    .material {
      width: 55%;
    }

    .final {
      font-size: 16px;
    }

    .acoes button {
      width: 100%;
    }

  }

  /* IMPRESSÃO */

  @media print {

    body {
      background: white;
    }

    main {
      max-width: none;
      margin: 0;
      padding: 0;
    }

    .acoes {
      display: none;
    }

    @page {
      size: A4;
      margin: 12mm;
    }

  }

</style>
</head>

<body>

<div class="acoes">

  <button onclick="window.print()">
    🖨️ Imprimir / Salvar PDF
  </button>

</div>

<main>

  <!-- LOGO E DADOS DA EMPRESA -->

  <header>

    <img
      class="logo"
      src="${logoEmpresa}"
      alt="Logo Ponto da Construção"
    >

    <div class="empresa">

      <h1>
        PONTO DA CONSTRUÇÃO
      </h1>

      <div class="sub">
        ORÇAMENTO DE MATERIAIS
      </div>

      <div class="telefone">
        WhatsApp: ${telefoneEmpresa}
      </div>

    </div>

  </header>

  <!-- CLIENTE E DATA -->

  <div class="dados">

    <strong>Cliente:</strong>
    ${escapar(nomeCliente)}

    <br>

    <strong>Emissão:</strong>
    ${escapar(new Date().toLocaleString('pt-BR'))}

  </div>

  <!-- MATERIAIS -->

  <table>

    <thead>
      <tr>
        <th>Material</th>

        <th class="numero">
          Qtd.
        </th>

        <th class="numero">
          Total
        </th>
      </tr>
    </thead>

    <tbody>
      ${linhas}
    </tbody>

  </table>

  <!-- TOTAIS -->

  <div class="totais">

    <div>
      <span>Materiais</span>
      <strong>${money(totalMateriais)}</strong>
    </div>

    <div>
      <span>Desconto</span>
      <strong>${money(desconto)}</strong>
    </div>

    <div class="final">

      <span>
        Total do orçamento
      </span>

      <span>
        ${money(totalFinal)}
      </span>

    </div>

  </div>

  <!-- OBSERVAÇÃO -->

  <p class="aviso">
    Este documento é apenas um orçamento.
    Não é comprovante de pagamento,
    venda ou reserva de estoque.
    Valores sujeitos a confirmação.
  </p>

</main>

</body>
</html>`;

  // =====================================
  // ABRIR ORÇAMENTO
  // =====================================

  janela.document.open();
  janela.document.write(html);
  janela.document.close();
  janela.focus();

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

    const principais = grupo.produtos.filter(produto =>
      produto.unidade &&
      ['dúzia', 'duzia'].includes(
        String(produto.unidade).trim().toLowerCase()
      ) &&
      produto.preco_avulso != null
    );

    const unidades = grupo.produtos.filter(produto =>
      String(produto.unidade || '')
        .trim().toLowerCase() === 'unidade'
    );

    // Um cadastro de dúzia e seu antigo cadastro
    // separado de unidade: usar apenas o ID da dúzia.
if (
  grupo.produtos.length === 2 &&
  principais.length === 1 &&
  unidades.length === 1 &&
  principais[0].estoque_unificado === true
) {
      const principal = principais[0];

      return [{
        nome: grupo.nome,
        produtos: [principal],
        opcoes: pcOpcoes(principal).map(opcao => ({
          ...opcao,
          id: principal.id
        }))
      }];
    }

    // Todos os demais produtos permanecem como antes.
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

  const ehAdministrador =
    state.user?.tipo === 'admin' ||
    state.user?.tipo === 'administrador';

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

            const produto = grupo.produtos.find(
              p => String(p.id) === String(id)
            );

            const quantidade =
              pcItem(id, opcao.tipo)?.qty || 0;

            const subtotal = Math.round(
              quantidade * opcao.preco * 100
            ) / 100;

            const revenda =
              produto?.controla_estoque === false;

            const possuiCusto =
              produto?.custo_referencia != null;

            const custo = Number(
              produto?.custo_referencia || 0
            );

            // Lucro bruto sem custo de frete
            const lucro =
              Number(opcao.preco) - custo;

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

                ${
                  revenda && ehAdministrador && possuiCusto
                    ? `
                      <div
                        style="
                          margin:10px 0;
                          padding:12px;
                          border:1px solid #dbe5ee;
                          border-radius:10px;
                          background:#f8fafc;
                          font-size:13px;
                        "
                      >
                        <strong>
                          🔒 Informações internas de revenda
                        </strong>

                        <div style="margin-top:8px">
                          Custo de compra:
                          <strong>${money(custo)}</strong>
                        </div>

                        <div style="margin-top:5px">
                          Lucro bruto estimado:
                          <strong>${money(lucro)}</strong>
                        </div>
                      </div>
                    `
                    : ''
                }

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
                      pcAlterar(${id},
                        '${opcao.tipo}',
                        1
                      );
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

  lista.innerHTML = state.cart.map(item => {

    const produto = (window.saleProducts || []).find(
      p => String(p.id) === String(item.id)
    );

    const opcao = produto
      ? pcOpcoes(produto).find(
          o => o.tipo === item.tipoOpcao
        )
      : null;

    const passo = opcao?.passo || 1;

    const id = Number(item.id);
    const tipo = String(item.tipoOpcao || '');

    // Apenas identificadores conhecidos podem ser usados nos controles.
    const podeEditar =
      Number.isSafeInteger(id) &&
      ['principal', 'avulso'].includes(tipo) &&
      Boolean(opcao);

    return `
      <div
        class="pc-resumo-linha"
        style="
          padding:14px 0;
          border-bottom:1px solid #e2e8f0;
        "
      >

        <strong style="display:block;margin-bottom:5px">
          ${pcEscapar(item.name)}
        </strong>

        <div
          style="
            color:#64748b;
            font-size:13px;
            margin-bottom:12px;
          "
        >
          ${money(item.price)} por ${pcEscapar(item.unit)}
        </div>

        <div
          style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            flex-wrap:wrap;
            gap:12px;
          "
        >

          ${
            podeEditar
              ? `
                <div
                  style="
                    display:flex;
                    align-items:center;
                    gap:7px;
                  "
                >

                  <button
                    type="button"
                    onclick="pcAlterar(${id}, '${tipo}', -1)"
                    style="
                      width:40px;
                      height:40px;
                      padding:0;
                      border-radius:9px;
                      background:#0b408e;
                      color:white;
                      font-size:24px;
                      font-weight:bold;
                    "
                  >−</button>

                  <input
                    type="number"
                    min="0"
                    step="${passo}"
                    value="${item.qty}"
                    aria-label="Quantidade de ${pcEscapar(item.name)}"
                    onchange="pcDefinir(${id}, '${tipo}', this.value)"
                    style="
                      width:75px;
                      height:40px;
                      text-align:center;
                      border:1px solid #dbe3ee;
                      border-radius:9px;
                      box-sizing:border-box;
                    "
                  >

                  <button
                    type="button"
                    onclick="pcAlterar(${id}, '${tipo}', 1)"
                    style="
                      width:40px;
                      height:40px;
                      padding:0;
                      border-radius:9px;
                      background:#0b408e;
                      color:white;
                      font-size:24px;
                      font-weight:bold;
                    "
                  >+</button>

                </div>
              `
              : `
                <span>
                  ${Number(item.qty).toLocaleString('pt-BR')}
                  ${pcEscapar(item.unit)}
                </span>
              `
          }

          <strong style="font-size:17px">
            ${money(pcSubtotal(item))}
          </strong>

        </div>

      </div>
    `;

  }).join('') || `
    <p class="muted">
      Escolha as quantidades nos materiais.
    </p>
  `;

  const total = pcTotal();

  const input = document.getElementById('saleDiscount');

  const valor = Number(input?.value || 0);

  state.saleDiscount = Math.round(
    Math.min(
      total,
      Math.max(0, Number.isFinite(valor) ? valor : 0)
    ) * 100
  ) / 100;

  const totalFinal =
    document.getElementById('pcTotalFinal');

  if (totalFinal) {
    totalFinal.textContent =
      money(total - state.saleDiscount);
  }

  const continuar =
    document.getElementById('pcContinuar');

  if (continuar) {
    continuar.disabled = !state.cart.length;
  }

  if (typeof window.pcAtualizarBarraCarrinho === 'function') {
    window.pcAtualizarBarraCarrinho();
  }

}
function pcLimparPedido() {
  state.cart = [];
  state.saleDiscount = 0;

  document.getElementById('saleDiscount').value = 0;

  pcMostrarProdutos();
  pcAtualizarResumo();
}
function openSaleNewClientForm(){

  window.clienteVendaLatitude = null;
window.clienteVendaLongitude = null;
  
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



async function saveSaleNewClient() {

  const nome = document.getElementById('newSaleClientName')?.value.trim();
  const telefone = document.getElementById('newSaleClientPhone')?.value.trim();
  const endereco = document.getElementById('newSaleClientAddress')?.value.trim();

  const latitude = window.clienteVendaLatitude ?? null;
  const longitude = window.clienteVendaLongitude ?? null;

  if (!nome) {
    alert('Informe o nome do cliente.');
    return;
  }

  const telefoneNumeros = (telefone || '').replace(/\D/g, '');

  if (telefoneNumeros.length < 10 || telefoneNumeros.length > 11) {
    alert('Informe um telefone válido com DDD.');
    return;
  }

  if (!endereco) {
    alert('Informe o endereço do cliente.');
    return;
  }

  // =====================================
  // VERIFICAR CLIENTE EXISTENTE
  // =====================================

  const { data: clientes, error: erroConsulta } =
    await supabaseClient
      .from('clientes')
      .select('id,nome,telefone,endereço');

  if (erroConsulta) {
    console.error('Erro ao verificar clientes:', erroConsulta);
    alert('Não foi possível verificar os clientes existentes. Tente novamente.');
    return;
  }

  const clienteExistente = (clientes || []).find(cliente =>
    String(cliente.telefone || '').replace(/\D/g, '') === telefoneNumeros
  );

  if (clienteExistente) {

    const usarExistente = confirm(
      '⚠️ Este telefone já está cadastrado!\n\n' +
      'Cliente: ' + clienteExistente.nome + '\n' +
      'Telefone: ' + clienteExistente.telefone + '\n' +
      'Endereço: ' + (clienteExistente.endereço || 'Não informado') +
      '\n\nDeseja utilizar este cliente na venda?'
    );

    if (usarExistente) {
      window.clienteVendaLatitude = null;
      window.clienteVendaLongitude = null;
      selectSaleClient(clienteExistente.id);
    }

    return;
  }

  // =====================================
  // CADASTRAR NOVO CLIENTE
  // =====================================

  const { data, error } = await supabaseClient
    .from('clientes')
    .insert({
      nome,
      telefone: telefoneNumeros,
      endereço: endereco,
      latitude,
      longitude
    })
    .select('id,nome,telefone,endereço,latitude,longitude')
    .single();

  if (error) {
    console.error('Erro ao cadastrar cliente:', error);
    alert('Não foi possível cadastrar o cliente:\n\n' + error.message);
    return;
  }

  window.clienteVendaLatitude = null;
  window.clienteVendaLongitude = null;

  // =====================================
  // SELECIONAR CLIENTE NA VENDA
  // =====================================

  state.selectedClient = data.id;

  const input = document.getElementById('saleClient');

  if (input) {
    input.value = data.nome;
    input.disabled = true;
  }

  const results = document.getElementById('saleClientResults');

  if (results) {
    results.innerHTML = `
      <div class="card">
        <div class="product-name">${pcEscapar(data.nome)}</div>
        <div class="muted">${pcEscapar(data.telefone)}</div>
        <div class="muted">${pcEscapar(data.endereço)}</div>

        ${
          data.latitude != null && data.longitude != null
            ? '<div class="muted" style="margin-top:8px">📍 Localização registrada no mapa</div>'
            : ''
        }

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
          <div style="font-weight:600">
            📍 Endereço e localização do cliente
          </div>

          <p class="muted" style="margin-top:8px">
            A entrega utilizará o endereço e a localização
            registrados no cadastro do cliente.
          </p>
        </div>
      `;

    } else {

      el.innerHTML = `
        Atendimento selecionado:
        <strong>🏪 Retirada</strong>
      `;

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

// Centro inicial: Vigia de Nazaré - PA
const mapa = L.map('mapaEntrega').setView(
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

async function confirmSale() {

  // Impedir confirmações simultâneas
  if (window.pcConfirmandoVenda === true) {
    return;
  }

  window.pcConfirmandoVenda = true;

  try {

    // Verificar se existe uma venda já registrada
    // cuja entrega ainda precisa ser concluída.
    let vendaPendente =
      window.pcVendaRegistradaPendente || null;

    if (!vendaPendente) {

      if (!window.salePayment) {
        alert('Selecione a forma de pagamento.');
        return;
      }

      if (!window.saleType) {
        alert('Selecione entrega ou retirada.');
        return;
      }

      if (!state.selectedClient) {
        alert('Selecione um cliente.');
        return;
      }

      if (!Array.isArray(state.cart) ||
          state.cart.length === 0) {
        alert('Adicione pelo menos um material.');
        return;
      }

      // ====================================
      // LOCALIZAÇÃO DO CLIENTE
      // ====================================

      let dadosEntrega = null;

      if (window.saleType === 'entrega') {

        const { data: cliente, error: clienteError } =
          await supabaseClient
            .from('clientes')
            .select('id,nome,endereço,latitude,longitude')
            .eq('id', state.selectedClient)
            .single();

        if (clienteError || !cliente) {

          console.error(
            'ERRO AO BUSCAR CLIENTE:',
            clienteError
          );

          alert(
            'Não foi possível consultar o endereço do cliente.'
          );

          return;
        }

        if (
          cliente.latitude == null ||
          cliente.longitude == null
        ) {

          alert(
            'Este cliente ainda não possui uma localização marcada no mapa.\n\n' +
            'Abra o cadastro do cliente e marque o local da entrega antes de continuar.'
          );

          return;
        }

        dadosEntrega = {
          endereco: cliente.endereço || null,
          latitude: cliente.latitude,
          longitude: cliente.longitude
        };
      }

      // ====================================
      // CALCULAR TOTAL
      // ====================================

      const totalMateriais = pcTotal();

      const desconto = Math.min(
        Math.max(0, Number(state.saleDiscount) || 0),
        totalMateriais
      );

      const total = totalMateriais - desconto;

      const itens = state.cart.map(item => ({
        produtos_id: item.id,
        quantidade: item.qty,
        preco_unitario: item.price,
        tipo_opcao: item.tipoOpcao || 'principal'
      }));

      // ====================================
      // REGISTRAR VENDA
      // ====================================

      const { data: vendaId, error } =
        await supabaseClient.rpc('registrar_venda', {
          p_cliente_id: state.selectedClient,
          p_valor_total: total,
          p_forma_pagamento: window.salePayment,
          p_itens: itens
        });

      if (error) {

        console.error(
          'ERRO AO REGISTRAR VENDA:',
          error
        );

        alert(
          'Não foi possível confirmar o resultado da venda.\n\n' +
          error.message +
          '\n\nAntes de tentar novamente, consulte o histórico de vendas para verificar se ela foi registrada.'
        );

        return;
      }

      if (vendaId == null) {
        alert(
          'O servidor não retornou o número da venda.\n\n' +
          'Consulte o histórico de vendas antes de tentar novamente.'
        );
        return;
      }

      console.log(
        'VENDA REGISTRADA:',
        vendaId
      );

      // Guardar o registro para evitar
      // uma segunda venda em caso de falha.
      vendaPendente = {
        vendaId: vendaId,
        tipo: window.saleType,
        dadosEntrega: dadosEntrega
      };

      window.pcVendaRegistradaPendente =
        vendaPendente;
    }

    // ====================================
    // REGISTRAR ENTREGA
    // ====================================

    if (vendaPendente.tipo === 'entrega') {

      const vendaId = vendaPendente.vendaId;

      // Verificar se a entrega já existe.
      // Isso evita duplicar a entrega caso
      // a resposta anterior tenha falhado.
      const {
        data: entregasExistentes,
        error: verificarErro
      } = await supabaseClient
        .from('entregas')
        .select('id')
        .eq('venda_id', vendaId)
        .limit(1);

      if (verificarErro) {

        console.error(
          'ERRO AO VERIFICAR ENTREGA:',
          verificarErro
        );

        alert(
          'A venda #' + vendaId +
          ' já foi registrada.\n\n' +
          'Não foi possível verificar a entrega. ' +
          'Tente confirmar novamente, sem criar outra venda.'
        );

        return;
      }

      if (!entregasExistentes?.length) {

        const {
          data: ultimaEntrega,
          error: filaError
        } = await supabaseClient
          .from('entregas')
          .select('posicao_fila')
          .neq('status', 'entregue')
          .order('posicao_fila', {
            ascending: false
          })
          .limit(1);

        if (filaError) {

          console.error(
            'ERRO AO VERIFICAR FILA:',
            filaError
          );

          alert(
            'A venda #' + vendaId +
            ' foi registrada, mas houve um erro na fila de entregas.\n\n' +
            'Tente confirmar novamente. ' +
            'O sistema não registrará outra venda.'
          );

          return;
        }

        const ultimaPosicao =
          ultimaEntrega?.length
            ? Number(
                ultimaEntrega[0].posicao_fila || 0
              )
            : 0;

        const { error: entregaError } =
          await supabaseClient
            .from('entregas')
            .insert({
              venda_id: vendaId,
              prioridade: false,
              posicao_fila: ultimaPosicao + 1,
              status: 'pendente',
              endereço:
                vendaPendente.dadosEntrega.endereco,
              latitude:
                vendaPendente.dadosEntrega.latitude,
              longitude:
                vendaPendente.dadosEntrega.longitude
            });

        if (entregaError) {

          console.error(
            'ERRO AO CRIAR ENTREGA:',
            entregaError
          );

          alert(
            'A venda #' + vendaId +
            ' foi registrada, mas não foi possível confirmar a entrega.\n\n' +
            entregaError.message +
            '\n\nTente confirmar novamente. ' +
            'A venda não será registrada outra vez.'
          );

          return;
        }
      }
    }

    // ====================================
    // FINALIZAÇÃO
    // ====================================

    const vendaId = vendaPendente.vendaId;

    // Limpar a venda pendente somente
    // após concluir a etapa da entrega.
    window.pcVendaRegistradaPendente = null;

    state.cart = [];
    state.selectedClient = null;
    state.saleDiscount = 0;
    state.cartOpen = false;

    window.salePayment = null;
    window.saleType = null;

    // Manter a impressão e a navegação
    // utilizadas no sistema original.
    abrirImpressaoVenda(vendaId, 'pago');

    navigate('home');

  } catch (erro) {

    console.error(
      'ERRO INESPERADO AO CONFIRMAR VENDA:',
      erro
    );

    if (window.pcVendaRegistradaPendente) {

      alert(
        'A venda #' +
        window.pcVendaRegistradaPendente.vendaId +
        ' já foi registrada, mas houve uma falha na finalização.\n\n' +
        'Não crie outra venda. ' +
        'Tente confirmar novamente para continuar.'
      );

    } else {

      alert(
        'Ocorreu um erro inesperado.\n\n' +
        'Verifique o histórico de vendas antes de tentar novamente.'
      );
    }

  } finally {

    // Liberar o botão mesmo após um erro.
    window.pcConfirmandoVenda = false;

  }
}



async function abrirImpressaoVenda(vendaId, tipo = 'pago') {

  if (!vendaId) {
    alert('Venda não encontrada.');
    return;
  }

  // ==============================
  // CARREGAR VENDA
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

  if (vendaError || !venda) {
    alert(
      vendaError?.message ||
      'Venda não encontrada.'
    );
    return;
  }

  // ==============================
  // CARREGAR CLIENTE
  // ==============================

  let cliente = {};

  if (venda.cliente_id) {

    const { data, error } = await supabaseClient
      .from('clientes')
      .select('nome,telefone,endereço')
      .eq('id', venda.cliente_id)
      .maybeSingle();

    if (error) {
      console.error('Erro ao carregar cliente:', error);
    } else {
      cliente = data || {};
    }
  }

  // ==============================
  // CARREGAR ITENS
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
    alert(
      'Não foi possível carregar os itens:\n' +
      itensError.message
    );
    return;
  }

  // ==============================
  // CARREGAR PRODUTOS
  // ==============================

  const produtoIds = [
    ...new Set(
      (itens || [])
        .map(item => item.produtos_id)
        .filter(id => id != null)
    )
  ];

  let produtos = [];

  if (produtoIds.length) {

    const { data, error } = await supabaseClient
      .from('produtos')
      .select('id,nome,unidade')
      .in('id', produtoIds);

    if (error) {
      alert(
        'Não foi possível carregar os produtos:\n' +
        error.message
      );
      return;
    }

    produtos = data || [];
  }

  // ==============================
  // INFORMAÇÕES DA EMPRESA
  // ==============================

  const logoEmpresa = new URL(
    'logo-ponto-construcao.png',
    document.baseURI
  ).href;

  const telefoneEmpresa = '(91) 98894-2001';

  const escapar = valor =>
    pcEscapar(String(valor ?? ''));

  const formatarQuantidade = valor => {
    const numero = Number(valor);

    if (!Number.isFinite(numero)) return '0';

    return numero.toLocaleString('pt-BR', {
      maximumFractionDigits: 3
    });
  };

  const formatarUnidade = unidade => {
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
  // MONTAR LINHAS DOS PRODUTOS
  // ==============================

  const linhasItens = (itens || []).map(item => {

    const produto = produtos.find(
      p => Number(p.id) === Number(item.produtos_id)
    ) || {};

    const quantidade = formatarQuantidade(
      item.quantidade
    );

    const unidade = formatarUnidade(
      item.unidade_venda || produto.unidade
    );

    return `
      <tr>
        <td class="material">
          ${escapar(produto.nome || 'Produto')}
        </td>

        <td class="quantidade">
          ${escapar(quantidade)}
          <span>${escapar(unidade)}</span>
        </td>

        <td class="valor">
          ${money(Number(item.subtotal || 0))}
        </td>
      </tr>
    `;
  }).join('');

  // ==============================
  // VALORES
  // ==============================

  const subtotalItens = (itens || []).reduce(
    (soma, item) =>
      soma + Number(item.subtotal || 0),
    0
  );

  const totalFinal = Number(venda.valor_total || 0);

  const valorAbatido = Math.max(
    0,
    subtotalItens - totalFinal
  );

  // ==============================
  // TIPO DE DOCUMENTO
  // ==============================

  const isOrcamento = tipo === 'orcamento';

  const titulo = isOrcamento
    ? 'ORÇAMENTO'
    : 'COMPROVANTE DE VENDA';

  const carimbo = isOrcamento
    ? ''
    : '<div class="carimbo-pago">PAGO</div>';

  const dataVenda = venda.data
    ? new Date(venda.data).toLocaleString('pt-BR')
    : 'Não informada';

  // ==============================
  // CABEÇALHO COMPARTILHADO
  // ==============================

  const cabecalho = `
    <div class="cabecalho">

      <img
        class="logo"
        src="${logoEmpresa}"
        alt="Logo Ponto da Construção"
      >

      <div class="empresa">
        PONTO DA CONSTRUÇÃO
      </div>

      <div class="subtitulo">
        MATERIAIS DE CONSTRUÇÃO
      </div>

      <div class="dados-empresa">
        Telefone / WhatsApp:
        <strong>${telefoneEmpresa}</strong>
      </div>

    </div>
  `;

  // ==============================
  // CONTEÚDO DE CADA VIA
  // ==============================

  function montarVia(nomeVia, rodape) {

    return `
      <div class="via">

        <div class="via-titulo">
          ${escapar(nomeVia)}
        </div>

        ${carimbo}

        ${cabecalho}

        ${
          isOrcamento
            ? '<div class="orcamento">ORÇAMENTO</div>'
            : ''
        }

        <div class="identificacao">

          <div>
            Venda nº:
            <strong>${escapar(venda.id)}</strong>
          </div>

          <div>
            Data:
            <strong>${escapar(dataVenda)}</strong>
          </div>

        </div>

        <div class="cliente">

          <strong>Cliente:</strong>
          ${escapar(cliente.nome || 'Não informado')}

          ${
            cliente.telefone
              ? `
                &nbsp; | &nbsp;
                <strong>Tel.:</strong>
                ${escapar(cliente.telefone)}
              `
              : ''
          }

          ${
            cliente.endereço
              ? `
                <br>
                <strong>End.:</strong>
                ${escapar(cliente.endereço)}
              `
              : ''
          }

        </div>

        <table class="tabela">

          <thead>
            <tr>
              <th>MATERIAL</th>
              <th>QUANTIDADE</th>
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

          <span>TOTAL GERAL:</span>
          <span>${money(totalFinal)}</span>

        </div>

        <div class="abatido">

          <span>VALOR ABATIDO:</span>
          <span>${money(valorAbatido)}</span>

        </div>

        ${
          !isOrcamento
            ? `
              <div class="pagamento">
                <strong>Forma de pagamento:</strong>
                ${escapar(venda.forma_pagamento || '-')}
              </div>
            `
            : ''
        }

        <div class="rodape">
          ${escapar(rodape)}
        </div>

      </div>
    `;
  }

  // ==============================
  // DOCUMENTO COMPLETO
  // ==============================

  const html = `<!DOCTYPE html>
<html lang="pt-BR">

<head>
<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width, initial-scale=1"
>

<title>
  ${titulo} - Venda ${escapar(venda.id)}
</title>

<style>

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    padding: 15px;
    background: #eee;
    font-family: Arial, Helvetica, sans-serif;
    color: #111;
  }

  .folha {
    width: 210mm;
    min-height: 297mm;
    margin: 0 auto;
    background: #fff;
    padding: 10mm;
  }

  .via {
    position: relative;
    min-height: 125mm;
  }

  .via-titulo {
    text-align: right;
    font-size: 10px;
    font-weight: bold;
    margin-bottom: 3px;
  }

  .cabecalho {
    text-align: center;
    border-bottom: 1px solid #222;
    padding-bottom: 8px;
    margin-bottom: 8px;
  }

  .logo {
    width: 80px;
    max-height: 80px;
    object-fit: contain;
    display: block;
    margin: 0 auto 8px;
  }

  .empresa {
    font-size: 20px;
    font-weight: bold;
  }

  .subtitulo {
    font-size: 11px;
    margin-top: 3px;
  }

  .dados-empresa {
    font-size: 11px;
    margin-top: 5px;
    font-weight: 500;
  }

  .identificacao {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    font-size: 11px;
    margin-bottom: 8px;
  }

  .cliente {
    font-size: 11px;
    margin-bottom: 9px;
    border-bottom: 1px solid #aaa;
    padding-bottom: 6px;
    line-height: 1.5;
  }

  .tabela {
    width: 100%;
    border-collapse: collapse;
    font-size: 11px;
  }

  .tabela th {
    border-bottom: 1px solid #222;
    padding: 4px;
    text-align: left;
  }

  .tabela td {
    padding: 5px 4px;
    border-bottom: 1px solid #ddd;
  }

  .material {
    width: 55%;
    text-transform: uppercase;
    font-weight: 600;
  }

  .quantidade {
    width: 20%;
    text-align: center;
  }

  .quantidade span {
    font-size: 9px;
    display: block;
    color: #555;
  }

  .valor {
    width: 25%;
    text-align: right;
    font-weight: bold;
  }

  .total {
    display: flex;
    justify-content: space-between;
    border-top: 2px solid #222;
    margin-top: 8px;
    padding-top: 7px;
    font-size: 15px;
    font-weight: bold;
  }

  .abatido {
    display: flex;
    justify-content: space-between;
    margin-top: 6px;
    font-size: 11px;
  }

  .pagamento {
    margin-top: 6px;
    font-size: 10px;
  }

  .rodape {
    margin-top: 10px;
    text-align: center;
    font-size: 9px;
  }

  .linha-corte {
    border-top: 2px dashed #555;
    margin: 5mm 0;
    padding-top: 3px;
    text-align: center;
    font-size: 9px;
    color: #555;
  }

  .carimbo-pago {
    position: absolute;
    right: 15px;
    top: 38px;
    border: 4px solid #b00000;
    color: #b00000;
    padding: 5px 12px;
    font-size: 24px;
    font-weight: 900;
    letter-spacing: 2px;
    transform: rotate(-10deg);
    opacity: .85;
  }

  .orcamento {
    text-align: center;
    font-size: 15px;
    font-weight: bold;
    margin-bottom: 7px;
  }

  @media print {

    body {
      padding: 0;
      background: #fff;
    }

    .folha {
      width: 210mm;
      min-height: 297mm;
      margin: 0;
      padding: 8mm;
    }

    @page {
      size: A4;
      margin: 0;
    }
  }

</style>

</head>

<body>

<div class="folha">

  ${montarVia(
    'VIA CLIENTE',
    'Obrigado pela preferência!'
  )}

  <div class="linha-corte">
    ✂ ------------------------------------------------ ✂
  </div>

  ${montarVia(
    'VIA EMPRESA - CONFERÊNCIA / COMPRAS',
    'Controle interno — Via da empresa'
  )}

</div>

<script>
  window.onload = function() {
    window.focus();

    setTimeout(function() {
      window.print();
    }, 500);
  };
</script>

</body>
</html>`;

  // ==============================
  // ABRIR IMPRESSÃO
  // ==============================

  const janela = window.open(
    '',
    '_blank',
    'width=900,height=700'
  );

  if (!janela) {
    alert(
      'O navegador bloqueou a janela de impressão. ' +
      'Permita pop-ups para este site.'
    );
    return;
  }

  janela.document.open();
  janela.document.write(html);
  janela.document.close();
}

async function renderProducts(el) {

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

    <button
      type="button"
      class="secondary"
      onclick="abrirEntradaMercadorias()"
    >
      📦 + Adicionar mercadorias
    </button>

    <div id="productList" class="list">
      <div class="card muted">
        Carregando estoque...
      </div>
    </div>
  `;

  try {

    const { data, error } = await supabaseClient
      .from('produtos')
      .select('*')
      .order('nome', { ascending: true });

    // Verificar se a página ainda está aberta
    const list = el.querySelector('#productList');

    if (!list || !list.isConnected) {
      return;
    }

    if (error) {
      throw error;
    }

    // Atualizar os produtos disponíveis
    state.products = data || [];
    window.currentProducts = data || [];

    if (!data || data.length === 0) {

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

    // Exibir os produtos
    list.innerHTML = productRows(data);

  } catch (erro) {

    console.error('Erro ao carregar estoque:', erro);

    const list = el.querySelector('#productList');

    if (!list || !list.isConnected) {
      return;
    }

    list.innerHTML = `
      <div class="card">
        <strong>Erro ao carregar estoque</strong>
        <p class="muted">
          Não foi possível carregar os produtos.
          Verifique sua conexão e tente novamente.
        </p>
        <button
          type="button"
          class="secondary"
          onclick="navigate('products')"
        >
          Tentar novamente
        </button>
      </div>
    `;

  }

}
function abrirEntradaMercadorias() {

  // =====================================
  // VERIFICAR PERMISSÃO
  // =====================================

  const ehAdmin = state.user?.tipo === 'admin';

  if (!ehAdmin) {
    alert('Apenas administradores podem adicionar mercadorias.');
    return;
  }

  // =====================================
  // CARREGAR PRODUTOS UNIFICADOS
  // =====================================

  const produtos = (window.currentProducts || [])
    .filter(p =>
      p.ativo === true &&
      p.estoque_unificado === true &&
      p.controla_estoque === true &&
      ['dúzia', 'duzia'].includes(
        String(p.unidade || '').trim().toLowerCase()
      )
    )
    .sort((a, b) =>
      String(a.nome || '').localeCompare(
        String(b.nome || ''),
        'pt-BR'
      )
    );

  if (!produtos.length) {
    alert('Nenhum produto com estoque unificado disponível.');
    return;
  }

  // =====================================
  // REMOVER JANELA ANTERIOR
  // =====================================

  document
    .getElementById('entradaMercadoriasModal')
    ?.remove();

  // =====================================
  // CRIAR JANELA
  // =====================================

  const modal = document.createElement('div');

  modal.id = 'entradaMercadoriasModal';

  // Fundo escurecido e janela centralizada
  Object.assign(modal.style, {
    position: 'fixed',
    inset: '0',
    zIndex: '999999',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0, 0, 0, 0.60)',
    padding: '16px',
    boxSizing: 'border-box',
    overflowY: 'auto'
  });

  // Proteção dos nomes dos produtos
  const escapar = valor =>
    String(valor ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c]));

  // =====================================
  // CONTEÚDO DA JANELA
  // =====================================

  modal.innerHTML = `

    <div
      class="modal-backdrop"
      style="
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: transparent;
      "
    >

      <div
        class="modal-card"
        style="
          background: #ffffff;
          color: #17243b;
          width: 100%;
          max-width: 520px;
          max-height: 90vh;
          overflow-y: auto;
          padding: 26px;
          border-radius: 18px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.25);
          box-sizing: border-box;
        "
      >

        <div
          class="modal-header"
          style="margin-bottom: 20px;"
        >

          <h2 style="
            color: #073b91;
            margin: 0;
          ">
            📦 Adicionar mercadorias
          </h2>

        </div>

        <div class="field" style="margin-bottom: 16px;">

          <label
            for="entradaProduto"
            style="display:block; margin-bottom:7px;"
          >
            Material
          </label>

          <select
            id="entradaProduto"
            style="
              width: 100%;
              padding: 12px;
              border: 1px solid #d7deea;
              border-radius: 10px;
              background: #ffffff;
              color: #17243b;
              box-sizing: border-box;
            "
          >

            ${produtos.map(p => `
              <option value="${p.id}">
                ${escapar(p.nome)}
              </option>
            `).join('')}

          </select>

        </div>

        <div class="field" style="margin-bottom: 16px;">

          <label
            for="entradaDuzias"
            style="display:block; margin-bottom:7px;"
          >
            Quantidade de dúzias
          </label>

          <input
            id="entradaDuzias"
            type="number"
            min="0"
            step="1"
            value="0"
            oninput="calcularEntradaMercadorias()"
            style="
              width: 100%;
              padding: 12px;
              border: 1px solid #d7deea;
              border-radius: 10px;
              background: #ffffff;
              color: #17243b;
              box-sizing: border-box;
            "
          >

        </div>

        <div class="field" style="margin-bottom: 16px;">

          <label
            for="entradaUnidades"
            style="display:block; margin-bottom:7px;"
          >
            Quantidade de unidades avulsas
          </label>

          <input
            id="entradaUnidades"
            type="number"
            min="0"
            step="1"
            value="0"
            oninput="calcularEntradaMercadorias()"
            style="
              width: 100%;
              padding: 12px;
              border: 1px solid #d7deea;
              border-radius: 10px;
              background: #ffffff;
              color: #17243b;
              box-sizing: border-box;
            "
          >

        </div>

        <div
          class="card"
          style="
            margin-top: 18px;
            padding: 18px;
            background: #f1f5fa;
            border: 1px solid #e1e8f2;
            border-radius: 12px;
            box-shadow: none;
          "
        >

          <strong style="color:#526176;">
            Total a acrescentar
          </strong>

          <h2
            id="entradaTotal"
            style="
              margin: 10px 0 0;
              color: #073b91;
              font-size: 28px;
            "
          >
            0 peças
          </h2>

        </div>

        <div
          class="actions"
          style="
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 22px;
          "
        >

          <button
            type="button"
            class="primary"
            onclick="salvarEntradaMercadorias()"
          >
            Confirmar entrada
          </button>

          <button
            type="button"
            class="secondary"
            onclick="document.getElementById('entradaMercadoriasModal')?.remove()"
          >
            Cancelar
          </button>

        </div>

      </div>

    </div>

  `;

  // =====================================
  // EXIBIR JANELA
  // =====================================

  document.body.appendChild(modal);

}


function calcularEntradaMercadorias() {

  const duzias = Number(
    document.getElementById('entradaDuzias')?.value || 0
  );

  const unidades = Number(
    document.getElementById('entradaUnidades')?.value || 0
  );

  const total = document.getElementById('entradaTotal');

  if (!total) return;

  if (
    !Number.isSafeInteger(duzias) ||
    !Number.isSafeInteger(unidades) ||
    duzias < 0 ||
    unidades < 0 ||
    !Number.isSafeInteger(duzias * 12 + unidades)
  ) {
    total.textContent = 'Quantidade inválida';
    return;
  }

  const pecas = duzias * 12 + unidades;

  total.textContent =
    `${pecas} ${pecas === 1 ? 'peça' : 'peças'}`;
}

async function salvarEntradaMercadorias() {

  const modal = document.getElementById('entradaMercadoriasModal');

  if (!modal) return;

  const botao = modal.querySelector('button.primary');

  if (!botao || botao.disabled) return;

  // =====================================
  // 1. VERIFICAR PERMISSÃO
  // =====================================

  const ehAdministrador =
    state.user?.tipo === 'admin' ||
    state.user?.tipo === 'administrador';

  if (!ehAdministrador) {
    alert('Somente administradores podem adicionar mercadorias.');
    return;
  }

  // =====================================
  // 2. IDENTIFICAR OS CAMPOS
  // =====================================

  const campoProduto = modal.querySelector('#entradaProduto');
  const campoDuzias = modal.querySelector('#entradaDuzias');
  const campoUnidades = modal.querySelector('#entradaUnidades');

  if (!campoProduto || !campoDuzias || !campoUnidades) {
    alert('Não foi possível identificar os campos da entrada.');
    return;
  }

  // =====================================
  // 3. IMPEDIR CAMPOS VAZIOS
  // =====================================

  if (!campoProduto.value.trim()) {
    alert('Selecione um material.');
    campoProduto.focus();
    return;
  }

  if (campoDuzias.value.trim() === '') {
    alert('Informe a quantidade de dúzias. Use 0 se não houver.');
    campoDuzias.focus();
    return;
  }

  if (campoUnidades.value.trim() === '') {
    alert('Informe a quantidade de unidades. Use 0 se não houver.');
    campoUnidades.focus();
    return;
  }

  // =====================================
  // 4. VALIDAR QUANTIDADES
  // =====================================

  const produtoId = Number(campoProduto.value);
  const duzias = Number(campoDuzias.value);
  const unidades = Number(campoUnidades.value);

  const totalPecas = duzias * 12 + unidades;

  if (
    !Number.isSafeInteger(produtoId) ||
    produtoId <= 0 ||
    !Number.isSafeInteger(duzias) ||
    !Number.isSafeInteger(unidades) ||
    duzias < 0 ||
    unidades < 0 ||
    !Number.isSafeInteger(totalPecas) ||
    totalPecas <= 0 ||
    !campoDuzias.validity.valid ||
    !campoUnidades.validity.valid
  ) {
    alert('Informe quantidades inteiras e um total maior que zero.');
    return;
  }

  // =====================================
  // 5. VERIFICAR PRODUTO
  // =====================================

  const produto = (window.currentProducts || []).find(
    p => Number(p.id) === produtoId
  );

  if (
    !produto ||
    produto.ativo !== true ||
    produto.estoque_unificado !== true ||
    produto.controla_estoque !== true ||
    !['dúzia', 'duzia'].includes(
      String(produto.unidade || '').trim().toLowerCase()
    )
  ) {
    alert('Produto inválido para entrada de mercadorias.');
    return;
  }

  // =====================================
  // 6. CONFIRMAÇÃO
  // =====================================

  const mensagem = [
    '📦 CONFIRMAR ENTRADA DE MERCADORIAS',
    '',
    'Material:',
    produto.nome,
    '',
    `Dúzias: ${duzias}`,
    `Unidades avulsas: ${unidades}`,
    '',
    `TOTAL A ACRESCENTAR: ${totalPecas} peças`,
    '',
    'Esta operação aumentará o estoque do produto.',
    '',
    'Deseja realmente confirmar?'
  ].join('\n');

  if (!window.confirm(mensagem)) {
    return;
  }

  // =====================================
  // 7. BLOQUEAR CLIQUES REPETIDOS
  // =====================================

  botao.disabled = true;
  botao.textContent = 'Salvando...';

  try {

    // =====================================
    // 8. REGISTRAR ENTRADA NO SUPABASE
    // =====================================

    const { data: novoEstoque, error } =
      await supabaseClient.rpc(
        'adicionar_mercadoria_estoque',
        {
          p_produto_id: produtoId,
          p_quantidade: totalPecas,
          p_tipo: 'unidade'
        }
      );

    if (error) {
      throw error;
    }

    // =====================================
    // 9. CONFIRMAR RESULTADO
    // =====================================

    console.log('Entrada registrada:', {
      produto: produto.nome,
      duzias,
      unidades,
      totalPecas,
      novoEstoque
    });

    alert(
      '✅ MERCADORIAS ADICIONADAS!\n\n' +
      `Material: ${produto.nome}\n` +
      `Quantidade adicionada: ${totalPecas} peças\n` +
      `Novo estoque: ${novoEstoque} peças`
    );

    modal.remove();

    // =====================================
    // 10. ATUALIZAR LISTA
    // =====================================

    if (state.page === 'products') {

      const conteudo = document.getElementById('content');

      if (conteudo) {
        await renderProducts(conteudo);
      }

    }

  } catch (erro) {

    console.error('Erro ao adicionar mercadorias:', erro);

    alert(
      'Não foi possível concluir a entrada.\n\n' +
      (erro.message || 'Erro desconhecido.')
    );

  } finally {

    if (botao.isConnected) {
      botao.disabled = false;
      botao.textContent = 'Confirmar entrada';
    }

  }

}

function filterProducts() {

  const input = document.getElementById('productSearch');
  const lista = document.getElementById('productList');

  if (!input || !lista) {
    return;
  }

  const normalizar = texto =>
    String(texto ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

  const busca = normalizar(input.value);

  const produtos = window.currentProducts || [];

  const filtrados = produtos.filter(produto => {

    const nome = normalizar(produto.nome);
    const categoria = normalizar(produto.categoria);
    const codigo = String(produto.id ?? '');

    return (
      nome.includes(busca) ||
      categoria.includes(busca) ||
      codigo.includes(busca)
    );

  });

  if (filtrados.length === 0) {

    lista.innerHTML = `
      <div class="card">
        <strong>Nenhum material encontrado.</strong>
        <p class="muted">
          Tente pesquisar por outro nome, categoria ou código.
        </p>
      </div>
    `;

    return;
  }

  lista.innerHTML = productRows(filtrados);

}


function openProductForm() {

  // Evitar abrir vários formulários
  document.getElementById('productModal')?.remove();

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

          <label>Nome do produto</label>

          <input
            id="newProductName"
            type="text"
            placeholder="Ex.: Cimento Poty"
          >

          <label>Categoria</label>

          <input
            id="newProductCategory"
            type="text"
            placeholder="Ex.: Cimento"
          >

          <label>Unidade</label>

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

          <label>Preço</label>

          <input
            id="newProductPrice"
            type="number"
            min="0"
            step="0.01"
            placeholder="0,00"
            required
          >

          <label>Tipo de produto</label>

          <select id="newProductStockType">
            <option value="estoque">
              📦 Tem no estoque
            </option>

            <option value="revenda">
              🛒 Item de revenda
            </option>
          </select>

          <div id="stockFields">

            <label>Estoque atual</label>

            <input
              id="newProductStock"
              type="number"
              min="0"
              step="0.01"
              value="0"
            >

            <label>Estoque mínimo</label>

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
    modal.querySelector('#newProductStockType');

  const stockFields =
    modal.querySelector('#stockFields');

  const botaoSalvar =
    modal.querySelector('#saveNewProductButton');

  function updateStockFields() {

    stockFields.style.display =
      stockType.value === 'revenda'
        ? 'none'
        : 'block';

  }

  stockType.addEventListener(
    'change',
    updateStockFields
  );

  updateStockFields();

  // Impedir vários salvamentos simultâneos
  let salvando = false;

  botaoSalvar.addEventListener('click', async () => {

    if (salvando) {
      return;
    }

    const nome =
      modal.querySelector('#newProductName')
        .value.trim();

    const categoria =
      modal.querySelector('#newProductCategory')
        .value.trim();

    const unidade =
      modal.querySelector('#newProductUnit')
        .value;

    const campoPreco =
      modal.querySelector('#newProductPrice');

    const precoTexto =
      campoPreco.value.trim();

    const tipoProduto =
      stockType.value;

    const controlaEstoque =
      tipoProduto === 'estoque';

    const campoEstoque =
      modal.querySelector('#newProductStock');

    const campoEstoqueMinimo =
      modal.querySelector('#newProductMinStock');

    // =====================================
    // VALIDAR NOME E CATEGORIA
    // =====================================

    if (!nome) {
      alert('Informe o nome do produto.');
      return;
    }

    if (!categoria) {
      alert('Informe a categoria.');
      return;
    }

    // =====================================
    // VALIDAR PREÇO
    // =====================================

    if (precoTexto === '') {
      alert('Informe o preço do produto.');
      campoPreco.focus();
      return;
    }

    const preco = Number(precoTexto);

    if (
      !Number.isFinite(preco) ||
      preco < 0 ||
      !campoPreco.validity.valid
    ) {
      alert('Informe um preço válido.');
      campoPreco.focus();
      return;
    }

    // =====================================
    // VALIDAR ESTOQUE
    // =====================================

    let estoque = 0;
    let estoqueMinimo = 0;

    if (controlaEstoque) {

      const estoqueTexto =
        campoEstoque.value.trim();

      const minimoTexto =
        campoEstoqueMinimo.value.trim();

      if (estoqueTexto === '') {
        alert('Informe o estoque atual.');
        campoEstoque.focus();
        return;
      }

      if (minimoTexto === '') {
        alert('Informe o estoque mínimo.');
        campoEstoqueMinimo.focus();
        return;
      }

      estoque = Number(estoqueTexto);
      estoqueMinimo = Number(minimoTexto);

      if (
        !Number.isFinite(estoque) ||
        estoque < 0 ||
        !campoEstoque.validity.valid
      ) {
        alert('Informe um estoque válido.');
        campoEstoque.focus();
        return;
      }

      if (
        !Number.isFinite(estoqueMinimo) ||
        estoqueMinimo < 0 ||
        !campoEstoqueMinimo.validity.valid
      ) {
        alert('Informe um estoque mínimo válido.');
        campoEstoqueMinimo.focus();
        return;
      }

    }

    // =====================================
    // BLOQUEAR CLIQUES REPETIDOS
    // =====================================

    salvando = true;
    botaoSalvar.disabled = true;
    botaoSalvar.textContent = 'Salvando...';

    try {

      // =====================================
      // CADASTRAR NO SUPABASE
      // =====================================

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
            controla_estoque: controlaEstoque

          });

      if (error) {
        throw error;
      }

      alert('Produto cadastrado com sucesso!');

      modal.remove();

      // Atualizar somente se ainda estiver no estoque
      if (state.page === 'products') {

        const content =
          document.getElementById('content');

        if (content) {
          await renderProducts(content);
        }

      }

    } catch (erro) {

      console.error(
        'Erro ao cadastrar produto:',
        erro
      );

      alert(
        'Não foi possível cadastrar o produto. ' +
        'Verifique os dados e tente novamente.'
      );

    } finally {

      salvando = false;

      if (botaoSalvar.isConnected) {
        botaoSalvar.disabled = false;
        botaoSalvar.textContent = 'Cadastrar produto';
      }

    }

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


function openProductEdit(id) {

  const produto = (window.currentProducts || []).find(
    p => String(p.id) === String(id)
  );

  if (!produto) {
    alert('Produto não encontrado.');
    return;
  }

  document.getElementById('productModal')?.remove();

  const escapar = valor =>
    String(valor ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c]));

  const modal = document.createElement('div');
  modal.id = 'productModal';

  const unidadeOriginal = String(
    produto.unidade || 'unidade'
  ).trim().toLowerCase();

  const precoAvulsoOriginal =
    produto.preco_avulso == null
      ? ''
      : String(produto.preco_avulso);

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

          <label>Nome do produto</label>
          <input
            id="editProductName"
            type="text"
            value="${escapar(produto.nome)}"
          >

          <label>Categoria</label>
          <input
            id="editProductCategory"
            type="text"
            value="${escapar(produto.categoria)}"
          >

          <label>Unidade principal</label>
          <select id="editProductUnit">
            ${[
              'm³',
              'kg',
              'carrada',
              'balde',
              'lata',
              'saco',
              'unidade',
              'dúzia',
              'milheiro'
            ].map(unidade => `
              <option
                value="${unidade}"
                ${unidadeOriginal === unidade ? 'selected' : ''}
              >
                ${unidade}
              </option>
            `).join('')}
          </select>

          <!-- PREÇOS DE VENDA -->

          <div style="
            margin-top:18px;
            padding:15px;
            border:1px solid #dbe5ee;
            border-radius:12px;
            background:#f8fafc;
          ">

            <h3 style="margin:0 0 12px">
              💰 Preços de venda
            </h3>

            <label id="editProductPriceLabel">
              Preço principal
            </label>

            <input
              id="editProductPrice"
              type="number"
              min="0"
              step="0.01"
              value="${escapar(produto.preco ?? '')}"
            >

            <div
              id="editProductAvulsoSection"
              style="margin-top:14px"
            >

              <label>
                Preço da unidade avulsa (R$)
              </label>

              <input
                id="editProductAvulsoPrice"
                type="number"
                min="0"
                step="0.01"
                placeholder="Informe o preço por unidade"
                value="${escapar(precoAvulsoOriginal)}"
              >

              <p
                class="muted"
                style="font-size:12px;margin-top:6px"
              >
                Este preço será utilizado na opção
                de venda por unidade, dentro do
                mesmo material.
              </p>

            </div>

          </div>

          <label style="margin-top:18px">
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

          <!-- ESTOQUE -->

          <div id="editStockFields">

            <div style="
              margin-top:18px;
              padding:15px;
              border:1px solid #dbe5ee;
              border-radius:12px;
            ">

              <h3 style="margin:0 0 12px">
                📦 Controle de estoque
              </h3>

              <label>
                ${produto.estoque_unificado === true
                  ? 'Estoque atual (peças individuais)'
                  : 'Estoque atual'}
              </label>

              <input
                id="editProductStock"
                type="number"
                min="0"
                step="${produto.estoque_unificado === true ? '1' : '0.01'}"
                value="${escapar(produto.estoque ?? 0)}"
              >

              ${produto.estoque_unificado === true ? `
                <p class="muted"
                   style="font-size:12px;margin-top:6px">
                  Estoque compartilhado entre dúzias
                  e unidades avulsas.
                  Cada dúzia corresponde a 12 peças.
                </p>
              ` : ''}

              <label>Estoque mínimo</label>

              <input
                id="editProductMinStock"
                type="number"
                min="0"
                step="${produto.estoque_unificado === true ? '1' : '0.01'}"
                value="${escapar(produto.estoque_minimo ?? 0)}"
              >

            </div>

          </div>

          <!-- INFORMAÇÕES DE REVENDA -->

          <div
            id="editProductResaleSection"
            style="
              margin-top:20px;
              padding:15px;
              border:1px solid #ddd;
              border-radius:12px;
              background:#f8fafc;
            "
          >

            <h3 style="margin:0 0 15px">
              💰 Informações de Revenda
            </h3>

            <label>Custo do fornecedor (R$)</label>
            <input
              id="editProductCost"
              type="number"
              min="0"
              step="0.01"
              value="${escapar(produto.custo_referencia ?? 0)}"
            >

            <label>Frete por unidade (R$)</label>
            <input
              id="editProductFreight"
              type="number"
              min="0"
              step="0.01"
              value="${escapar(produto.frete_referencia ?? 0)}"
            >

            <label>Margem desejada (%)</label>
            <input
              id="editProductMargin"
              type="number"
              min="0"
              max="99.99"
              step="0.01"
              value="${escapar(produto.margem_desejada ?? 0)}"
            >

            <label>Fornecedor habitual</label>
            <input
              id="editProductSupplier"
              type="text"
              value="${escapar(produto.fornecedor_referencia)}"
              placeholder="Nome do fornecedor"
            >

            <label>Observações</label>
            <textarea
              id="editProductResaleNotes"
              rows="3"
              style="
                width:100%;
                box-sizing:border-box;
                padding:12px;
                border:1px solid #ddd;
                border-radius:8px;
                resize:vertical;
              "
              placeholder="Informações sobre a revenda..."
            >${escapar(produto.observacoes_revenda)}</textarea>

            <div style="
              margin-top:15px;
              padding:14px;
              border-radius:10px;
              background:#e8f5e9;
              color:#1b5e20;
            ">

              <div style="margin-bottom:8px">
                <strong>Custo completo:</strong>
                <span id="editProductTotalCost">
                  R$ 0,00
                </span>
              </div>

              <div style="margin-bottom:8px">
                <strong>Lucro bruto estimado:</strong>
                <span id="editProductProfit">
                  R$ 0,00
                </span>
              </div>

              <div>
                <strong>Margem bruta:</strong>
                <span id="editProductProfitMargin">
                  0,00%
                </span>
              </div>

            </div>

          </div>

          <!-- BOTÕES -->

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
    modal.querySelector('#editProductStockType');

  const stockFields =
    modal.querySelector('#editStockFields');

  const resaleSection =
    modal.querySelector('#editProductResaleSection');

  const unidadeSelect =
    modal.querySelector('#editProductUnit');

  const avulsoSection =
    modal.querySelector('#editProductAvulsoSection');

  const precoLabel =
    modal.querySelector('#editProductPriceLabel');

  function atualizarTipoProduto() {

    const revenda = stockType.value === 'revenda';

    stockFields.style.display =
      revenda ? 'none' : 'block';

    resaleSection.style.display =
      revenda ? 'block' : 'none';

  }

  function atualizarUnidade() {

    const unidade = unidadeSelect.value;

    const permiteAvulso =
      ['dúzia', 'duzia', 'milheiro'].includes(unidade);

    avulsoSection.style.display =
      permiteAvulso ? 'block' : 'none';

    if (unidade === 'dúzia' || unidade === 'duzia') {
      precoLabel.textContent = 'Preço da dúzia (R$)';
    } else if (unidade === 'milheiro') {
      precoLabel.textContent = 'Preço do milheiro (R$)';
    } else {
      precoLabel.textContent =
        'Preço por ' + unidade + ' (R$)';
    }

  }

  stockType.addEventListener(
    'change',
    atualizarTipoProduto
  );

  unidadeSelect.addEventListener(
    'change',
    atualizarUnidade
  );

  // CÁLCULO DE REVENDA

  function calcularLucroRevenda() {

    const preco = Number(
      modal.querySelector('#editProductPrice').value
    );

    const custo = Number(
      modal.querySelector('#editProductCost').value
    );

    const frete = Number(
      modal.querySelector('#editProductFreight').value
    );

    const custoTotal = custo + frete;
    const lucro = preco - custoTotal;

    const margem = preco > 0
      ? (lucro / preco) * 100
      : 0;

    const moeda = valor =>
      valor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      });

    modal.querySelector(
      '#editProductTotalCost'
    ).textContent = moeda(custoTotal);

    modal.querySelector(
      '#editProductProfit'
    ).textContent = moeda(lucro);

    modal.querySelector(
      '#editProductProfitMargin'
    ).textContent =
      margem.toFixed(2).replace('.', ',') + '%';

  }

  [
    'editProductPrice',
    'editProductCost',
    'editProductFreight'
  ].forEach(idCampo => {

    modal.querySelector('#' + idCampo)
      .addEventListener('input', calcularLucroRevenda);

  });

  atualizarTipoProduto();
  atualizarUnidade();
  calcularLucroRevenda();

  modal.querySelector('#saveProductEditButton')
    .addEventListener('click', () => {
      saveProductEdit(id);
    });

}


async function saveProductEdit(id) {

  const campo = nome => document.getElementById(nome);
  const botao = campo('saveProductEditButton');

  // Evitar cliques repetidos
  if (!botao || botao.disabled) return;

  const produtoOriginal = (window.currentProducts || [])
    .find(p => String(p.id) === String(id));

  if (!produtoOriginal) {
    alert('Produto não encontrado. Atualize a página.');
    return;
  }

  // =====================================
  // 1. DADOS BÁSICOS
  // =====================================

  const nome = campo('editProductName')?.value.trim() || '';
  const categoria = campo('editProductCategory')?.value.trim() || '';
  const unidade = campo('editProductUnit')?.value || '';

  const controlaEstoque =
    campo('editProductStockType')?.value === 'estoque';

  if (!nome || !categoria || !unidade) {
    alert('Preencha nome, categoria e unidade.');
    return;
  }

  // =====================================
  // 2. PREÇO PRINCIPAL
  // =====================================

  const campoPreco = campo('editProductPrice');
  const textoPreco = campoPreco?.value.trim() || '';

  if (!textoPreco) {
    alert('Informe o preço do produto.');
    campoPreco?.focus();
    return;
  }

  const preco = Number(textoPreco);

  if (
    !Number.isFinite(preco) ||
    preco < 0 ||
    !campoPreco.validity.valid
  ) {
    alert('Informe um preço válido.');
    campoPreco.focus();
    return;
  }

  // =====================================
  // 3. PREÇO DA UNIDADE AVULSA
  // =====================================

  const permiteAvulso = [
    'dúzia',
    'duzia',
    'milheiro'
  ].includes(unidade.trim().toLowerCase());

  const campoAvulso = campo('editProductAvulsoPrice');

  if (!campoAvulso) {
    alert(
      'Campo de preço avulso não encontrado. ' +
      'Atualize a página.'
    );
    return;
  }

  let precoAvulso = null;

  if (permiteAvulso) {

    const textoAvulso = campoAvulso.value.trim();

    if (textoAvulso !== '') {

      precoAvulso = Number(textoAvulso);

      if (
        !Number.isFinite(precoAvulso) ||
        precoAvulso < 0 ||
        !campoAvulso.validity.valid
      ) {
        alert(
          'Informe um preço válido para a unidade avulsa.'
        );
        campoAvulso.focus();
        return;
      }

    }

  }

  // =====================================
  // 4. INFORMAÇÕES DE REVENDA
  // =====================================

  function lerNumero(idCampo, descricao) {

    const elemento = campo(idCampo);

    if (!elemento) {
      throw new Error('Campo não encontrado: ' + descricao);
    }

    const texto = elemento.value.trim();

    if (texto === '') return 0;

    const valor = Number(texto);

    if (
      !Number.isFinite(valor) ||
      valor < 0 ||
      !elemento.validity.valid
    ) {
      throw new Error('Verifique o campo: ' + descricao);
    }

    return valor;
  }

  let custoReferencia;
  let freteReferencia;
  let margemDesejada;

  try {

    custoReferencia = lerNumero(
      'editProductCost',
      'Custo do fornecedor'
    );

    freteReferencia = lerNumero(
      'editProductFreight',
      'Frete por unidade'
    );

    margemDesejada = lerNumero(
      'editProductMargin',
      'Margem desejada'
    );

  } catch (erro) {

    alert(erro.message);
    return;

  }

  if (margemDesejada >= 100) {
    alert('A margem desejada deve ser menor que 100%.');
    return;
  }

  const fornecedorReferencia =
    campo('editProductSupplier')?.value.trim() || '';

  const observacoesRevenda =
    campo('editProductResaleNotes')?.value.trim() || '';

  // =====================================
  // 5. ESTOQUE
  // =====================================

  let estoque = null;
  let estoqueMinimo = null;

  if (controlaEstoque) {

    const campoEstoque = campo('editProductStock');
    const campoMinimo = campo('editProductMinStock');

    const textoEstoque = campoEstoque?.value.trim() || '';
    const textoMinimo = campoMinimo?.value.trim() || '';

    if (!textoEstoque) {
      alert('Informe o estoque atual.');
      campoEstoque?.focus();
      return;
    }

    if (!textoMinimo) {
      alert('Informe o estoque mínimo.');
      campoMinimo?.focus();
      return;
    }

    estoque = Number(textoEstoque);
    estoqueMinimo = Number(textoMinimo);

    if (
      !Number.isFinite(estoque) ||
      estoque < 0 ||
      !campoEstoque.validity.valid
    ) {
      alert('Informe um estoque atual válido.');
      campoEstoque.focus();
      return;
    }

    if (
      !Number.isFinite(estoqueMinimo) ||
      estoqueMinimo < 0 ||
      !campoMinimo.validity.valid
    ) {
      alert('Informe um estoque mínimo válido.');
      campoMinimo.focus();
      return;
    }

  }

  // =====================================
  // 6. PROTEGER ESTOQUE UNIFICADO
  // =====================================

  if (produtoOriginal.estoque_unificado === true) {

    if (unidade !== produtoOriginal.unidade) {
      alert(
        'A unidade de um material com estoque ' +
        'unificado não pode ser alterada.'
      );
      return;
    }

    if (!controlaEstoque) {
      alert(
        'Não é permitido desativar o controle ' +
        'de estoque deste material.'
      );
      return;
    }

    if (
      !Number.isSafeInteger(estoque) ||
      !Number.isSafeInteger(estoqueMinimo)
    ) {
      alert(
        'O estoque unificado deve ser informado ' +
        'em peças inteiras.'
      );
      return;
    }

  }

  // =====================================
  // 7. PREPARAR DADOS PARA O SUPABASE
  // =====================================

  const atualizacao = {
    nome,
    categoria,
    unidade,
    preco,
    controla_estoque: controlaEstoque,
    custo_referencia: custoReferencia,
    frete_referencia: freteReferencia,
    margem_desejada: margemDesejada,
    fornecedor_referencia: fornecedorReferencia,
    observacoes_revenda: observacoesRevenda
  };

  // Atualizar o preço avulso somente quando
  // a unidade principal permitir venda avulsa.
  if (permiteAvulso) {

    const precoAnterior =
      produtoOriginal.preco_avulso == null
        ? null
        : Number(produtoOriginal.preco_avulso);

    if (precoAnterior !== precoAvulso) {
      atualizacao.preco_avulso = precoAvulso;
    }

  }

  // Não enviar estoque de itens de revenda.
  // Preservar valores que não foram alterados.
  if (controlaEstoque) {

    if (
      Number(produtoOriginal.estoque ?? 0) !== estoque
    ) {
      atualizacao.estoque = estoque;
    }

    if (
      Number(produtoOriginal.estoque_minimo ?? 0) !==
      estoqueMinimo
    ) {
      atualizacao.estoque_minimo = estoqueMinimo;
    }

  }

  // =====================================
  // 8. SALVAR
  // =====================================

  botao.disabled = true;
  botao.textContent = 'Salvando...';

  try {

    const { data, error } = await supabaseClient
      .from('produtos')
      .update(atualizacao)
      .eq('id', id)
      .select('id');

    if (error) throw error;

    if (!data || data.length !== 1) {
      throw new Error(
        'O banco não confirmou a atualização.'
      );
    }

    alert('Produto atualizado com sucesso!');

    document.getElementById('productModal')?.remove();

    if (state.page === 'products') {

      const conteudo = document.getElementById('content');

      if (conteudo) {
        await renderProducts(conteudo);
      }

    }

  } catch (erro) {

    console.error('Erro ao salvar produto:', erro);

    alert(
      'Não foi possível salvar o produto.\n\n' +
      (erro.message || 'Erro desconhecido.')
    );

  } finally {

    if (botao.isConnected) {
      botao.disabled = false;
      botao.textContent = 'Salvar alterações';
    }

  }

}



async function renderDeliveries(el) {

  if (!el) return;

  const escapar = valor =>
    String(valor ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c]));

  const formatarQuantidade = valor =>
    Number(valor).toLocaleString('pt-BR', {
      maximumFractionDigits: 3
    });

  const ehAdministrador =
    state.user?.tipo === 'admin' ||
    state.user?.tipo === 'administrador';

  el.innerHTML = `
    <div class="card">
      <strong>🚚 Fila de entregas</strong>
      <p class="muted">Carregando entregas e materiais...</p>
    </div>
  `;

  try {

    // =====================================
    // 1. CONSULTAR ENTREGAS
    // =====================================

    const { data: entregas, error: erroEntregas } =
      await supabaseClient
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
        .order('posicao_fila', {
          ascending: true,
          nullsFirst: false
        })
        .order('id', { ascending: true });

    if (erroEntregas) throw erroEntregas;

    if (!el.isConnected || state.page !== 'deliveries') {
      return;
    }

    if (!entregas?.length) {

      el.innerHTML = `
        <div class="card">
          <h2>🚚 Nenhuma entrega na fila</h2>
          <p class="muted">
            As entregas aparecerão aqui quando forem criadas.
          </p>
        </div>
      `;

      return;
    }

    // =====================================
    // 2. CONSULTAR MATERIAIS DAS VENDAS
    // =====================================

    const idsVendas = [
      ...new Set(
        entregas
          .map(e => e.venda_id)
          .filter(id => id != null)
      )
    ];

    let itens = [];

    if (idsVendas.length) {

      const { data, error } = await supabaseClient
        .from('itens_venda')
        .select(`
          id,
          vendas_id,
          produtos_id,
          quantidade,
          unidade_venda,
          origem_material,
          controle_entrega_estoque_ativo,
          produtos (
            nome
          )
        `)
        .in('vendas_id', idsVendas);

      if (error) throw error;

      itens = data || [];
    }

    // =====================================
    // 3. CONSULTAR HISTÓRICO DE RECEBIMENTOS
    // =====================================

    // A política atual de itens_entregues permite
    // consulta aos administradores.
    // Não exibimos saldos como zero para entregadores
    // sem permissão de leitura.

    let recebimentos = [];

    if (ehAdministrador && itens.length) {

      const idsItens = itens
        .filter(i => i.controle_entrega_estoque_ativo === true)
        .map(i => i.id);

      if (idsItens.length) {

        const { data, error } = await supabaseClient
          .from('itens_entregues')
          .select(`
            id,
            item_venda_id,
            entrega_id,
            quantidade_entregue,
            quantidade_estoque_proprio,
            data_entrega
          `)
          .in('item_venda_id', idsItens);

        if (error) throw error;

        recebimentos = data || [];
      }
    }

    // =====================================
    // 4. ORGANIZAR QUANTIDADES
    // =====================================

    const totalRecebidoPorItem = new Map();

    for (const registro of recebimentos) {

      const anterior =
        totalRecebidoPorItem.get(registro.item_venda_id) || 0;

      totalRecebidoPorItem.set(
        registro.item_venda_id,
        anterior + Number(registro.quantidade_entregue || 0)
      );
    }

    const itensPorVenda = new Map();

    for (const item of itens) {

      if (!itensPorVenda.has(item.vendas_id)) {
        itensPorVenda.set(item.vendas_id, []);
      }

      itensPorVenda.get(item.vendas_id).push(item);
    }

    // =====================================
    // 5. MONTAR TELA
    // =====================================

    const pendentes = entregas.filter(
      e => e.status !== 'entregue'
    ).length;

    el.innerHTML = `

      <div class="card">

        <h2 style="margin-bottom:8px">
          🚚 Fila de entregas
        </h2>

        <p class="muted">
          ${entregas.length} entrega(s) cadastrada(s).
        </p>

        <p style="margin-top:8px">
          <strong>${pendentes}</strong>
          entrega(s) ainda não finalizada(s).
        </p>

      </div>

      <div class="list" style="margin-top:12px">

        ${entregas.map((entrega, indice) => {

          const venda = entrega.vendas;
          const cliente = venda?.clientes;

          const nomeCliente = escapar(
            cliente?.nome || 'Cliente não informado'
          );

          const endereco = escapar(
            entrega.endereço ||
            cliente?.endereço ||
            'Endereço não informado'
          );

          const telefone = escapar(
            cliente?.telefone || 'Sem telefone'
          );

          const valor = Number(venda?.valor_total || 0);

          const materiais =
            itensPorVenda.get(entrega.venda_id) || [];

          const controleNovo = materiais.some(
            item => item.controle_entrega_estoque_ativo === true
          );

          const statusTexto = {
            pendente: '⏳ Pendente',
            em_rota: '🚚 Em rota',
            entregue: '✅ Entregue'
          }[entrega.status] || entrega.status;

          let blocoMateriais = '';

          if (!materiais.length) {

            blocoMateriais = `
              <p class="muted">
                Nenhum material encontrado para esta venda.
              </p>
            `;

          } else if (!controleNovo) {

            blocoMateriais = `
              <p class="muted">
                Esta venda pertence ao controle anterior.
                O histórico detalhado de recebimentos
                não está disponível.
              </p>
            `;

          } else if (!ehAdministrador) {

            blocoMateriais = `
              <p class="muted">
                O detalhamento dos saldos de entrega
                está disponível para administradores.
              </p>
            `;

          } else {

            blocoMateriais = materiais.map(item => {

              const quantidadeVendida =
                Number(item.quantidade || 0);

              const quantidadeEntregue =
                totalRecebidoPorItem.get(item.id) || 0;

              const quantidadePendente = Math.max(
                0,
                quantidadeVendida - quantidadeEntregue
              );

              const unidade = escapar(
                item.unidade_venda || 'unidade'
              );

              const nome = escapar(
                item.produtos?.nome || 'Material'
              );

              const concluido =
                quantidadePendente <= 0;

              return `

                <div style="
                  border:1px solid #e2e8f0;
                  border-radius:10px;
                  padding:12px;
                  margin-top:10px;
                ">

                  <strong>${nome}</strong>

                  <p class="muted" style="margin-top:5px">
                    Unidade: ${unidade}
                  </p>

                  <div style="
                    display:grid;
                    grid-template-columns:repeat(3,minmax(0,1fr));
                    gap:8px;
                    margin-top:12px;
                    text-align:center;
                  ">

                    <div>
                      <small class="muted">Vendido</small>
                      <div>
                        <strong>
                          ${formatarQuantidade(quantidadeVendida)}
                        </strong>
                      </div>
                    </div>

                    <div>
                      <small class="muted">Entregue</small>
                      <div style="color:#166534">
                        <strong>
                          ${formatarQuantidade(quantidadeEntregue)}
                        </strong>
                      </div>
                    </div>

                    <div>
                      <small class="muted">Falta</small>
                      <div style="color:${
                        concluido ? '#166534' : '#b45309'
                      }">
                        <strong>
                          ${formatarQuantidade(quantidadePendente)}
                        </strong>
                      </div>
                    </div>

                  </div>

<p style="
  margin-top:10px;
  font-size:12px;
  font-weight:600;
  color:${concluido ? '#166534' : '#b45309'};
">
  ${concluido
    ? '✅ Material totalmente recebido'
    : '⏳ Recebimento pendente'}
</p>

${
  !concluido &&
  entrega.status === 'em_rota' &&
  item.controle_entrega_estoque_ativo === true
    ? `

    <div style="
      margin-top:14px;
      padding-top:14px;
      border-top:1px solid #e2e8f0;
    ">

      <strong>
        📦 Registrar recebimento
      </strong>

      <p class="muted" style="margin-top:8px">
        Informe quanto o cliente realmente recebeu.
      </p>

      <div class="field" style="margin-top:12px">

        <label>
          Quantidade recebida (${unidade})
        </label>

        <input
          type="number"
          id="recebido_${item.id}"
          min="0"
          max="${quantidadePendente}"
          step="any"
          placeholder="Ex.: 5"
        >

      </div>

      <div class="field" style="margin-top:12px">

        <label>
          Quantidade de estoque próprio (${unidade})
        </label>

        <input
          type="number"
          id="proprio_${item.id}"
          min="0"
          max="${quantidadePendente}"
          step="any"
          value="0"
          ${item.origem_material === 'revenda'
            ? 'disabled'
            : ''}
        >

        <small class="muted">
          ${
            item.origem_material === 'revenda'
              ? 'Material de revenda: não desconta estoque próprio.'
              : 'Informe apenas a parte que saiu do estoque próprio.'
          }
        </small>

      </div>

      <div class="field" style="margin-top:12px">

        <label>
          Observação (opcional)
        </label>

        <input
          type="text"
          id="observacao_${item.id}"
          placeholder="Ex.: Primeira viagem"
        >

      </div>

      <button
        type="button"
        class="primary"
        style="
          width:100%;
          margin-top:14px;
        "
        onclick="
          confirmarRecebimentoParcial(
            ${Number(entrega.id)},
            '${item.id}',
            document.getElementById('recebido_${item.id}').value,
            document.getElementById('proprio_${item.id}').value,
            document.getElementById('observacao_${item.id}').value
          )
        "
      >
        ✅ Confirmar recebimento parcial
      </button>

    </div>

  `
    : ''
}

                </div>
              `;

            }).join('');

          }

          return `

            <div class="card">

              <div class="row">

                <strong>
                  #${escapar(entrega.id)} · ${nomeCliente}
                </strong>

                <span class="badge ${escapar(entrega.status)}">
                  ${escapar(statusTexto)}
                </span>

              </div>

              ${entrega.prioridade === true ? `
                <p style="
                  color:#b91c1c;
                  font-weight:700;
                  margin-top:10px;
                ">
                  🔴 Entrega prioritária
                </p>
              ` : ''}

              <p class="muted" style="margin-top:12px">
                📍 ${endereco}
              </p>

              <p class="muted">
                ☎ ${telefone}
              </p>

              <div class="row" style="margin-top:12px">

                <strong>
                  ${money(valor)}
                </strong>

                <span class="muted">
                  ${escapar(venda?.forma_pagamento || '')}
                </span>

              </div>

              <div style="
                border-top:1px solid #e2e8f0;
                margin-top:16px;
                padding-top:14px;
              ">

                <strong>📦 Materiais da venda</strong>

                ${blocoMateriais}

              </div>

              <div class="actions" style="margin-top:16px">

                <button
                  type="button"
                  class="secondary"
                  onclick="abrirMapaEntrega(${Number(entrega.id)})"
                >
                  🗺️ Ver no mapa
                </button>

                ${entrega.status !== 'entregue' ? `

                  ${indice > 0 ? `
                    <button
                      type="button"
                      class="secondary"
                      onclick="moveDelivery(${Number(entrega.id)},-1)"
                    >
                      ↑ Colocar na frente
                    </button>
                  ` : ''}

                  ${indice < entregas.length - 1 ? `
                    <button
                      type="button"
                      class="secondary"
                      onclick="moveDelivery(${Number(entrega.id)},1)"
                    >
                      ↓
                    </button>
                  ` : ''}

                ` : ''}

                ${entrega.status === 'pendente' ? `

                  <button
                    type="button"
                    class="primary"
                    onclick="nextDelivery(${Number(entrega.id)})"
                  >
                    🚚 Iniciar rota
                  </button>

                ` : ''}

                ${entrega.status === 'em_rota' ? `

                  <p class="muted" style="font-size:12px">
                    Aguardando o novo controle de confirmação
                    de recebimento.
                  </p>

                ` : ''}

              </div>

            </div>

          `;

        }).join('')}

      </div>
    `;

  } catch (erro) {

    console.error(
      'Erro ao carregar tela de entregas:',
      erro
    );

    if (!el.isConnected) return;

    el.innerHTML = `
      <div class="card">
        <h2>Não foi possível carregar as entregas</h2>
        <p class="muted">
          ${escapar(erro.message || 'Erro desconhecido.')}
        </p>
      </div>
    `;

  }

}

const chavesRecebimentoPendente = new Map();

async function confirmarRecebimentoParcial(
  entregaId,
  itemVendaId,
  quantidade,
  quantidadePropria,
  observacao = ''
) {

  if (state.user?.tipo !== 'admin') {
    alert('Somente administradores podem confirmar recebimentos.');
    return false;
  }

  const entregue = Number(quantidade);
  const propria = Number(quantidadePropria);
  const textoObservacao = String(observacao || '').trim();

  if (!Number.isFinite(entregue) || entregue <= 0) {
    alert('Informe uma quantidade recebida válida.');
    return false;
  }

  if (
    !Number.isFinite(propria) ||
    propria < 0 ||
    propria > entregue
  ) {
    alert('Confira a quantidade de estoque próprio.');
    return false;
  }

  if (
    !Number.isSafeInteger(Number(entregaId)) ||
    Number(entregaId) <= 0 ||
    !itemVendaId
  ) {
    alert('Entrega ou material inválido.');
    return false;
  }

  const identificador = `${entregaId}:${itemVendaId}`;

  // Guarda a chave e os valores até termos confirmação
  // do resultado. Uma repetição usa a mesma chave.

  const tentativaAnterior =
    chavesRecebimentoPendente.get(identificador);

  if (tentativaAnterior?.executando) {
    alert('Aguarde a confirmação anterior.');
    return false;
  }

  const valores = JSON.stringify({
    entregue,
    propria,
    observacao: textoObservacao
  });

  if (
    tentativaAnterior &&
    tentativaAnterior.valores !== valores
  ) {
    alert(
      'Existe uma confirmação anterior sem resultado conhecido.\n\n' +
      'Confira o histórico antes de alterar as quantidades.'
    );
    return false;
  }

  const tentativa = tentativaAnterior || {
    chave: crypto.randomUUID(),
    valores,
    executando: false
  };

  tentativa.executando = true;

  chavesRecebimentoPendente.set(
    identificador,
    tentativa
  );

  try {

    const { data, error } = await supabaseClient.rpc(
      'confirmar_entrega_parcial',
      {
        p_entrega_id: Number(entregaId),
        p_item_venda_id: itemVendaId,
        p_quantidade_entregue: entregue,
        p_quantidade_estoque_proprio: propria,
        p_observacao: textoObservacao,
        p_chave_confirmacao: tentativa.chave
      }
    );

    if (error) {
      throw error;
    }

    // O banco confirmou a operação.
    chavesRecebimentoPendente.delete(identificador);

    console.log('Recebimento confirmado:', data);

    alert('Recebimento registrado com sucesso!');

    if (state.page === 'deliveries') {
      await renderDeliveries(
        document.getElementById('content')
      );
    }

    return true;

  } catch (erro) {

    console.error('Erro no recebimento:', erro);

    alert(
      'Não foi possível confirmar o resultado.\n\n' +
      (erro.message || 'Erro desconhecido.') +
      '\n\nConfira o histórico antes de tentar novamente.'
    );

    // Mantemos a chave para permitir uma repetição segura.
    return false;

  } finally {

    tentativa.executando = false;

  }

}
async function nextDelivery(id) {

  try {

    const { data, error } = await supabaseClient
      .from('entregas')
      .select('id, status, posicao_fila')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      alert('Entrega não encontrada.');
      return;
    }

    // ENTREGA JÁ FINALIZADA

    if (data.status === 'entregue') {
      alert('Esta entrega já está finalizada.');
      return;
    }

    // IMPEDIR FINALIZAÇÃO PELO MÉTODO ANTIGO

    if (data.status !== 'pendente') {

      alert(
        'A confirmação de recebimento será feita ' +
        'pelo novo controle de entregas parciais.\n\n' +
        'Por enquanto, esta entrega não será finalizada.'
      );

      return;
    }

    // INICIAR ROTA

    const confirmou = window.confirm(
      'Deseja iniciar a rota desta entrega?'
    );

    if (!confirmou) {
      return;
    }

    const { data: atualizada, error: updateError } =
      await supabaseClient
        .from('entregas')
        .update({
          status: 'em_rota'
        })
        .eq('id', id)
        .eq('status', 'pendente')
        .select('id')
        .maybeSingle();

    if (updateError) {
      throw updateError;
    }

    if (!atualizada) {
      alert(
        'O status desta entrega foi alterado. ' +
        'Atualize a página e tente novamente.'
      );
      return;
    }

    await renderDeliveries(
      document.getElementById('content')
    );

  } catch (erro) {

    console.error(
      'Erro ao atualizar entrega:',
      erro
    );

    alert(
      'Não foi possível atualizar a entrega:\n\n' +
      (erro.message || 'Erro desconhecido.')
    );

  }

}



async function renderReports(el) {

  if (!el) return;

  const anoAtual = new Date().getFullYear();

  el.innerHTML = `
    <div class="section-title">
      <h2>📊 Faturamento mensal e anual</h2>
    </div>

    <div class="card" style="margin-bottom:16px">

      <div class="field" style="margin-bottom:14px">
        <label for="lucroAno">Selecionar ano</label>

        <input
          id="lucroAno"
          type="number"
          class="search"
          min="2000"
          max="2100"
          step="1"
          value="${anoAtual}"
          onchange="carregarLucroAnual()"
        >
      </div>

      <div id="lucroAnualConteudo">
        <p class="muted">
          Carregando faturamento...
        </p>
      </div>

    </div>

    <div class="card">

      <div class="section-title">
        <h2>Relatórios de vendas</h2>
      </div>

      <div
        class="row"
        style="
          gap:10px;
          flex-wrap:wrap;
          margin-bottom:15px;
        "
      >

        <div
          class="field"
          style="flex:1;min-width:140px"
        >
          <label>Data inicial</label>

          <input
            id="reportDateStart"
            class="search"
            type="date"
          >
        </div>

        <div
          class="field"
          style="flex:1;min-width:140px"
        >
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
          style="margin-top:22px"
        >
          Filtrar
        </button>

      </div>

      <div id="reportSummary"></div>

      <div id="reportsList" class="list">
        <div class="muted">
          Carregando vendas...
        </div>
      </div>

    </div>
  `;

  await Promise.all([
    carregarLucroAnual(),
    carregarRelatorio()
  ]);
}



async function carregarLucroAnual() {

  const campoAno =
    document.getElementById('lucroAno');

  const painel =
    document.getElementById('lucroAnualConteudo');

  if (!campoAno || !painel) return;

  const ano = Number(campoAno.value);

  if (
    !Number.isInteger(ano) ||
    ano < 2000 ||
    ano > 2100
  ) {
    painel.textContent = 'Informe um ano válido.';
    return;
  }

  painel.innerHTML = `
    <p class="muted">
      Consultando faturamento...
    </p>
  `;

  const meses = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro'
  ];

  const resultados = meses.map(nome => ({
    nome,
    faturamento: 0,
    quantidadeVendas: 0,
    incompleto: false
  }));

  const formatar = valor =>
    Number(valor).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });

  // =====================================
  // CONSULTA PAGINADA
  // =====================================

  async function consultarVendas() {

    const registros = [];
    const tamanhoPagina = 1000;

    const inicioAno = new Date(ano, 0, 1);
    const fimAno = new Date(ano + 1, 0, 1);

    for (let pagina = 0; ; pagina++) {

      const inicio = pagina * tamanhoPagina;

      const { data, error } = await supabaseClient
        .from('vendas')
        .select('id,data,valor_total,status')
        .gte('data', inicioAno.toISOString())
        .lt('data', fimAno.toISOString())
        .order('data', { ascending: true })
        .order('id', { ascending: true })
        .range(
          inicio,
          inicio + tamanhoPagina - 1
        );

      if (error) throw error;

      const lote = data || [];

      registros.push(...lote);

      if (lote.length < tamanhoPagina) {
        break;
      }
    }

    return registros;
  }

  // =====================================
  // CALCULAR FATURAMENTO
  // =====================================

  try {

    const vendas = await consultarVendas();

    for (const venda of vendas) {

      // Considerar apenas vendas concluídas.
      if (venda.status !== 'concluida') {
        continue;
      }

      const dataVenda = new Date(venda.data);

      if (Number.isNaN(dataVenda.getTime())) {
        continue;
      }

      // Usar o ano e o mês locais.
      if (dataVenda.getFullYear() !== ano) {
        continue;
      }

      const mes = dataVenda.getMonth();
      const resultado = resultados[mes];

      resultado.quantidadeVendas++;

      const valor = Number(venda.valor_total);

      if (
        venda.valor_total === null ||
        !Number.isFinite(valor) ||
        valor < 0
      ) {
        resultado.incompleto = true;
        continue;
      }

      resultado.faturamento += valor;
    }

    // =====================================
    // TOTAL ANUAL
    // =====================================

    let faturamentoAnual = 0;
    let quantidadeAnual = 0;
    let anoIncompleto = false;

    const linhas = resultados.map(resultado => {

      faturamentoAnual += resultado.faturamento;

      quantidadeAnual +=
        resultado.quantidadeVendas;

      if (resultado.incompleto) {
        anoIncompleto = true;
      }

      const valorExibido = resultado.incompleto
        ? 'Incompleto'
        : formatar(resultado.faturamento);

      return `
        <div
          class="row"
          style="
            padding:11px 0;
            border-bottom:1px solid #e5e7eb;
            gap:10px;
          "
        >
          <span>
            ${resultado.nome}
          </span>

          <strong>
            ${valorExibido}
          </strong>
        </div>
      `;
    }).join('');

    const totalExibido = anoIncompleto
      ? 'Incompleto'
      : formatar(faturamentoAnual);

    // Evitar atualização de outra página
    // ou de outro ano selecionado.
    if (
      !painel.isConnected ||
      Number(campoAno.value) !== ano
    ) {
      return;
    }

    // =====================================
    // EXIBIR RESULTADOS
    // =====================================

    painel.innerHTML = `

      <div
        style="
          padding:16px;
          border-radius:12px;
          background:#f1f5f9;
          margin-bottom:16px;
        "
      >

        <div class="muted">
          Faturamento total de ${ano}
        </div>

        <div
          style="
            font-size:26px;
            font-weight:800;
            margin-top:6px;
          "
        >
          ${totalExibido}
        </div>

        <small class="muted">
          ${quantidadeAnual}
          venda(s) concluída(s)
        </small>

      </div>

      <h3 style="margin-bottom:10px">
        Faturamento por mês
      </h3>

      ${linhas}

      <div
        class="row"
        style="
          padding:16px 0;
          font-weight:800;
          gap:10px;
        "
      >
        <span>
          TOTAL ANUAL
        </span>

        <strong>
          ${totalExibido}
        </strong>
      </div>

      ${anoIncompleto ? `
        <p
          class="muted"
          style="
            color:#b45309;
            margin-top:12px;
          "
        >
          ⚠️ Algumas vendas possuem
          valores inválidos ou ausentes.
          Confira os registros antes de
          utilizar o total anual.
        </p>
      ` : `
        <p
          class="muted"
          style="
            font-size:12px;
            margin-top:12px;
          "
        >
          Faturamento calculado a partir
          dos valores finais das vendas
          concluídas, considerando os
          descontos registrados.
          Não representa lucro.
        </p>
      `}

    `;

  } catch (erro) {

    console.error(
      'Erro ao consultar faturamento anual:',
      erro
    );

    if (
      painel.isConnected &&
      Number(campoAno.value) === ano
    ) {
      painel.textContent =
        'Não foi possível consultar o faturamento. ' +
        'Verifique a conexão e as permissões.';
    }
  }
}



async function carregarRelatorio(){

  const lista = document.getElementById('reportsList');

  if(!lista){
    return;
  }

  const escaparHTML = valor => String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const formatarQuantidade = valor =>
    Number(valor || 0).toLocaleString('pt-BR', {
      maximumFractionDigits: 3
    });

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
        <p class="muted">${escaparHTML(error.message)}</p>
      </div>
    `;

    return;
  }

if(!vendas || vendas.length === 0){

  const resumo = document.getElementById('reportSummary');

  if(resumo){
    resumo.innerHTML = `
      <div class="card" style="margin-bottom:15px;">

        <div class="row">
          <span>Quantidade de vendas</span>
          <strong>0</strong>
        </div>

        <div class="row">
          <span>Total vendido</span>
          <strong class="total">
            ${money(0)}
          </strong>
        </div>

        <div class="row">
          <span>Vendas com compra externa</span>
          <strong style="color:#b45309;">
            0
          </strong>
        </div>

      </div>
    `;
  }

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

  const vendasIds = vendas.map(v => v.id);

  let clientes = [];

  if(clientesIds.length){

    const respostaClientes =
      await supabaseClient
        .from('clientes')
        .select('id,nome,telefone')
        .in('id', clientesIds);

    if(respostaClientes.error){
      console.error(
        'Erro ao carregar clientes do relatório:',
        respostaClientes.error
      );
    }

    clientes = respostaClientes.data || [];
  }

  const mapaClientes = {};

  clientes.forEach(cliente => {
    mapaClientes[cliente.id] = cliente;
  });

  // =====================================
  // CONSULTAR COMPRAS EXTERNAS
  // =====================================

  let itensExternos = [];

const { data: itens, error: erroItens } =
  await supabaseClient.rpc(
    'consultar_compras_externas_admin',
    {
      p_vendas_ids: vendasIds
    }
  );

  if(erroItens){

    console.error(
      'Erro ao consultar compras externas:',
      erroItens
    );

    lista.innerHTML = `
      <div class="card">
        <strong>Não foi possível carregar o relatório completo.</strong>
        <p class="muted">
          A consulta das compras externas apresentou um erro.
          Nenhuma venda foi alterada.
        </p>
        <p class="muted">
          ${escaparHTML(erroItens.message)}
        </p>
      </div>
    `;

    return;
  }

  itensExternos = itens || [];

  // =====================================
  // BUSCAR NOMES DOS PRODUTOS
  // =====================================

  const produtosIds = [
    ...new Set(
      itensExternos
        .map(item => item.produtos_id)
        .filter(id => id !== null && id !== undefined)
    )
  ];

  const mapaProdutos = {};

  if(produtosIds.length){

    const { data: produtos, error: erroProdutos } =
      await supabaseClient
        .from('produtos')
        .select('id,nome,unidade,estoque_unificado')
        .in('id', produtosIds);

    if(erroProdutos){

      console.error(
        'Erro ao carregar produtos:',
        erroProdutos
      );

      lista.innerHTML = `
        <div class="card">
          <strong>Não foi possível carregar os materiais.</strong>
          <p class="muted">
            ${escaparHTML(erroProdutos.message)}
          </p>
        </div>
      `;

      return;
    }

    (produtos || []).forEach(produto => {
      mapaProdutos[produto.id] = produto;
    });
  }

  // =====================================
  // AGRUPAR COMPRAS POR VENDA
  // =====================================

  const comprasPorVenda = {};

  itensExternos.forEach(item => {

    if(!comprasPorVenda[item.vendas_id]){
      comprasPorVenda[item.vendas_id] = [];
    }

    comprasPorVenda[item.vendas_id].push(item);

  });

  // =====================================
  // RESUMO
  // =====================================

  const vendasValidas = vendas.filter(
    venda => venda.status === 'concluida'
  );

  const totalVendido = vendasValidas.reduce(
    (soma, venda) =>
      soma + Number(venda.valor_total || 0),
    0
  );

  const vendasComCompraExterna =
    vendasValidas.filter(venda =>
      (comprasPorVenda[venda.id] || []).length > 0
    ).length;

 const painelResumo = document.getElementById('reportSummary');

if (!painelResumo || state.page !== 'reports') return;

painelResumo.innerHTML = `
    <div class="card" style="margin-bottom:15px;">

      <div class="row">
        <span>Quantidade de vendas</span>
        <strong>${vendasValidas.length}</strong>
      </div>

      <div class="row">
        <span>Total vendido</span>
        <strong class="total">
          ${money(totalVendido)}
        </strong>
      </div>

      <div class="row">
        <span>Vendas com compra externa</span>
        <strong style="color:#b45309;">
          ${vendasComCompraExterna}
        </strong>
      </div>

    </div>
  `;

  // =====================================
  // LISTAGEM DE VENDAS
  // =====================================

  lista.innerHTML = vendas.map(venda => {

    const cliente = mapaClientes[venda.cliente_id];

    const nomeCliente =
      cliente?.nome || 'Cliente não informado';

    const formaPagamento =
      venda.forma_pagamento || 'Não informado';

    const dataVenda = venda.data
      ? new Date(venda.data).toLocaleString('pt-BR')
      : 'Data não informada';

    const compras = comprasPorVenda[venda.id] || [];

    const avisoCompraExterna = compras.length
      ? `
        <div style="
          margin-top:14px;
          padding:14px;
          border:2px solid #d97706;
          border-radius:10px;
          background:#fffbeb;
          color:#78350f;
        ">

          <strong>
            ⚠️ COMPRA EXTERNA NECESSÁRIA
          </strong>

          <p style="margin:8px 0;">
            Esta venda possui materiais que precisam
            ser adquiridos em outra loja.
          </p>

          ${compras.map(item => {

            const produto =
              mapaProdutos[item.produtos_id];

            const nomeProduto =
              produto?.nome ||
              `Produto #${item.produtos_id}`;

            const unidadeProduto =
              produto?.estoque_unificado &&
              ['dúzia','duzia'].includes(
                String(produto?.unidade || '')
                  .trim()
                  .toLowerCase()
              )
                ? 'unidade(s)'
                : produto?.unidade || 'unidade(s)';

            const custo =
              item.custo_compra_externa;

            return `
              <div style="
                margin-top:10px;
                padding-top:10px;
                border-top:1px solid #fcd34d;
              ">

                <strong>
                  ${escaparHTML(nomeProduto)}
                </strong>

                <div>
                  Quantidade a comprar:
                  <strong>
                    ${formatarQuantidade(
                      item.quantidade_compra_externa
                    )}
                    ${escaparHTML(unidadeProduto)}
                  </strong>
                </div>

                <div>
                  Custo externo:
                  <strong>
                    ${
                      custo === null ||
                      custo === undefined
                        ? 'Não informado'
                        : money(Number(custo))
                    }
                  </strong>
                </div>

              </div>
            `;

          }).join('')}

          <p style="
            margin:10px 0 0;
            font-size:12px;
          ">
            Aviso interno. A quantidade representa
            a necessidade identificada no registro
            da venda, não a confirmação da compra.
          </p>

        </div>
      `
      : '';

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
          ${escaparHTML(nomeCliente)}
        </div>

        <div class="muted">
          ${escaparHTML(dataVenda)}
        </div>

        <div class="muted">
          Pagamento: ${escaparHTML(formaPagamento)}
        </div>

        ${avisoCompraExterna}

        <div class="row" style="margin-top:12px;">

          <span class="muted">
            Status:
            ${escaparHTML(venda.status || '—')}
          </span>

          <button
            class="btn primary"
            onclick="abrirImpressaoVenda(${Number(venda.id)}, 'pago')"
          >
            Imprimir
          </button>

          ${
            state.user?.tipo === 'admin' &&
            venda.status === 'concluida'
              ? `
                <button
                  class="btn secondary"
                  style="color:#b91c1c;"
                  onclick="abrirConfirmacaoCancelamento(${Number(venda.id)}, '${String(formaPagamento).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}')"
                >
                  Cancelar venda
                </button>
              `
              : ''
          }

        </div>

      </div>
    `;

  }).join('');

}



async function renderCash(el) {

  const ehAdministrador =
    state.user?.tipo === 'admin' ||
    state.user?.tipo === 'administrador';

  if (!ehAdministrador) {
    el.innerHTML = `
      <div class="card">
        <h2>Acesso restrito</h2>
        <p class="muted">
          O Caixa / Financeiro é exclusivo dos administradores.
        </p>
      </div>
    `;
    return;
  }

  // =====================================
  // CONFIGURAÇÃO DO PERÍODO
  // =====================================

  const agora = new Date();

  const mesAtual = Number(
    window.caixaMesSelecionado ?? agora.getMonth() + 1
  );

  const anoAtual = Number(
    window.caixaAnoSelecionado ?? agora.getFullYear()
  );

  const mes =
    Number.isInteger(mesAtual) &&
    mesAtual >= 1 &&
    mesAtual <= 12
      ? mesAtual
      : agora.getMonth() + 1;

  const ano =
    Number.isInteger(anoAtual) &&
    anoAtual >= 2000 &&
    anoAtual <= 2100
      ? anoAtual
      : agora.getFullYear();

  window.caixaMesSelecionado = mes;
  window.caixaAnoSelecionado = ano;

  const meses = [
    'Janeiro', 'Fevereiro', 'Março',
    'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro',
    'Outubro', 'Novembro', 'Dezembro'
  ];

  const opcoesMeses = meses.map((nome, indice) => `
    <option
      value="${indice + 1}"
      ${mes === indice + 1 ? 'selected' : ''}
    >
      ${nome}
    </option>
  `).join('');

  const opcoesAnos = Array.from(
    { length: 101 },
    (_, indice) => 2000 + indice
  ).map(valor => `
    <option
      value="${valor}"
      ${ano === valor ? 'selected' : ''}
    >
      ${valor}
    </option>
  `).join('');

  // =====================================
  // IDENTIFICAÇÃO DESTA CONSULTA
  // =====================================

  const consultaId =
    (window.caixaConsultaId || 0) + 1;

  window.caixaConsultaId = consultaId;

  const consultaAtiva = () =>
    state.page === 'cash' &&
    el.isConnected &&
    window.caixaConsultaId === consultaId;

  // =====================================
  // MONTAR TELA
  // =====================================

  el.innerHTML = `
    <div class="section-title">
      <h2>💰 Caixa / Financeiro</h2>
    </div>

    <div class="card">
      <h3>📅 Consultar período</h3>

      <div style="
        display:grid;
        grid-template-columns:repeat(2,minmax(0,1fr));
        gap:12px;
        margin-top:12px;
      ">

        <div class="field">
          <label for="caixaFiltroMes">Mês</label>

          <select id="caixaFiltroMes" class="search">
            ${opcoesMeses}
          </select>
        </div>

        <div class="field">
          <label for="caixaFiltroAno">Ano</label>

          <select id="caixaFiltroAno" class="search">
            ${opcoesAnos}
          </select>
        </div>

      </div>

      <button
        type="button"
        class="primary"
        id="caixaConsultarPeriodo"
        style="margin-top:12px"
      >
        Consultar período
      </button>
    </div>

    <div class="section-title">
      <h2>Resumo — ${meses[mes - 1]} de ${ano}</h2>
    </div>

    <div class="grid stats">

      <div class="card stat">
        <div class="label">Entradas totais</div>
        <div class="value" id="caixaEntradas">
          Carregando...
        </div>
      </div>

      <div class="card stat">
 <div class="label">Total de saídas</div>
        <div class="value" id="caixaSaidas">
          Carregando...
        </div>
      </div>

<div class="card stat">
  <div class="label">↩️ Estornos de vendas</div>
  <div class="value" id="caixaEstornos">
    Carregando...
  </div>
</div>

      <div class="card stat">
        <div class="label">Saldo do período</div>
        <div class="value" id="caixaSaldo">
          Carregando...
        </div>
      </div>

      <div class="card stat">
        <div class="label">🚚 Gastos com o veículo</div>
        <div class="value" id="caixaGastosVeiculo">
          Carregando...
        </div>
      </div>

    </div>

    <!-- FECHAMENTO DIÁRIO: CONSULTA INDEPENDENTE DO MÊS -->
    <div class="card" style="margin-top:18px">
      <h3>📊 Fechamento diário</h3>
      <p class="muted" style="margin:8px 0">
        Consulte e imprima o movimento de uma data, sem gravar um fechamento.
      </p>
      <div class="field" style="margin-top:12px">
        <label for="caixaFechamentoData">Data do fechamento</label>
        <input id="caixaFechamentoData" class="search" type="date"
          min="2000-01-01" max="2100-12-31">
      </div>
      <div class="actions" style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
        <button type="button" class="primary" id="caixaFechamentoConsultar">
          📊 Consultar dia
        </button>
        <button type="button" class="secondary" id="caixaFechamentoImprimir" disabled>
          🖨️ Imprimir fechamento
        </button>
      </div>
      <div id="caixaFechamentoResultado" style="margin-top:14px" aria-live="polite">
        Selecione uma data e toque em Consultar dia.
      </div>
    </div>

    <!-- BOTÃO PARA ABRIR O FORMULÁRIO -->

    <div style="margin:20px 0">

      <button
        type="button"
        class="primary"
        id="caixaBotaoNovo"
      >
        ＋ Nova movimentação
      </button>

    </div>

    <!-- FORMULÁRIO INICIALMENTE FECHADO -->

    <div
      id="caixaFormulario"
      class="card"
      style="display:none;margin-bottom:20px"
    >

      <div class="row">
        <h3>📝 Nova movimentação</h3>

        <button
          type="button"
          class="secondary"
          id="caixaFecharFormulario"
        >
          ✕ Fechar
        </button>
      </div>

      <div class="field" style="margin-top:14px">
        <label for="caixaTipo">Tipo</label>

        <select id="caixaTipo" class="search">
          <option value="saida">Saída</option>
          <option value="entrada">Entrada</option>
        </select>
      </div>

      <div class="field" style="margin-top:14px">
        <label for="caixaCategoria">Categoria</label>

        <select id="caixaCategoria" class="search">
        </select>
      </div>

      <div class="field" style="margin-top:14px">
        <label for="caixaDescricao">Descrição</label>

        <input
          id="caixaDescricao"
          class="search"
          type="text"
          maxlength="200"
          placeholder="Ex.: Abastecimento do carro"
        >
      </div>

      <div class="field" style="margin-top:14px">
        <label for="caixaValor">Valor (R$)</label>

        <input
          id="caixaValor"
          class="search"
          type="number"
          min="0.01"
          step="0.01"
          placeholder="0,00"
        >
      </div>

      <div class="field" style="margin-top:14px">
        <label for="caixaData">Data da movimentação</label>

        <input
          id="caixaData"
          class="search"
          type="date"
          min="2000-01-01"
          max="2100-12-31"
        >
      </div>

      <div class="actions" style="margin-top:18px">

        <button
          type="button"
          class="primary"
          id="caixaSalvarMovimentacao"
        >
          💾 Salvar movimentação
        </button>

        <button
          type="button"
          class="secondary"
          id="caixaCancelarMovimentacao"
        >
          Cancelar
        </button>

      </div>

    </div>

    <div class="section-title">
      <h2>📋 Histórico do período</h2>
    </div>

    <div id="caixaHistorico" class="list">
      <div class="card">
        Carregando movimentações...
      </div>
    </div>

    <p class="muted" style="
      margin-top:14px;
      font-size:12px;
    ">
      O resumo inclui entradas manuais, vendas concluídas
      em dinheiro, Pix ou cartão e pagamentos de dívidas.
      O histórico reúne vendas à vista, recebimentos de dívidas
      e lançamentos manuais. Não registre vendas ou recebimentos
      novamente como entradas manuais.
    </p>
  `;

  // =====================================
  // ELEMENTOS DO FORMULÁRIO
  // =====================================

  const campo = id => el.querySelector('#' + id);

  const formulario = campo('caixaFormulario');
  const botaoNovo = campo('caixaBotaoNovo');
  const botaoSalvar = campo('caixaSalvarMovimentacao');

  const tipoInput = campo('caixaTipo');
  const categoriaInput = campo('caixaCategoria');
  const descricaoInput = campo('caixaDescricao');
  const valorInput = campo('caixaValor');
  const dataInput = campo('caixaData');

  // =====================================
  // CATEGORIAS
  // =====================================

  const categoriasSaida = [
    {
      valor: 'despesa_geral',
      nome: 'Despesa geral'
    },
    {
      valor: 'veiculo_combustivel',
      nome: '🚚 Veículo — Combustível'
    },
    {
      valor: 'veiculo_pneus',
      nome: '🚚 Veículo — Pneus'
    },
    {
      valor: 'veiculo_manutencao',
      nome: '🚚 Veículo — Manutenção / Oficina'
    },
    {
      valor: 'veiculo_oleo',
      nome: '🚚 Veículo — Troca de óleo'
    },
    {
      valor: 'veiculo_documentacao',
      nome: '🚚 Veículo — Documentação / Seguro'
    },
    {
      valor: 'veiculo_outros',
      nome: '🚚 Veículo — Outras despesas'
    }
  ];

  const categoriasEntrada = [
    {
      valor: 'outra_entrada',
      nome: 'Outra entrada manual'
    }
  ];

  function atualizarCategorias() {

    const categorias =
      tipoInput.value === 'entrada'
        ? categoriasEntrada
        : categoriasSaida;

    categoriaInput.innerHTML = categorias.map(c => `
      <option value="${c.valor}">
        ${c.nome}
      </option>
    `).join('');
  }

  tipoInput.addEventListener(
    'change',
    atualizarCategorias
  );

  atualizarCategorias();

  // =====================================
  // DATA LOCAL
  // =====================================

  function dataLocalFormatada(data) {

    const anoData = data.getFullYear();
    const mesData = String(
      data.getMonth() + 1
    ).padStart(2, '0');

    const diaData = String(
      data.getDate()
    ).padStart(2, '0');

    return `${anoData}-${mesData}-${diaData}`;
  }

  dataInput.value = dataLocalFormatada(agora);

  // =====================================
  // FECHAMENTO DIÁRIO AUTOMÁTICO
  // Não altera nem grava movimentações.
  // =====================================

  const fechamentoData = campo('caixaFechamentoData');
  const fechamentoConsultar = campo('caixaFechamentoConsultar');
  const fechamentoImprimir = campo('caixaFechamentoImprimir');
  const fechamentoResultado = campo('caixaFechamentoResultado');
  fechamentoData.value = dataLocalFormatada(agora);
  let fechamentoAtual = null;
  let fechamentoConsultaId = 0;

  const fechamentoDinheiro = valor => {
    const numero = Number(valor);
    return Number.isFinite(numero) && numero > 0
      ? Math.round(numero * 100) : 0;
  };

  const fechamentoForma = valor => {
    const forma = String(valor || '').trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (forma === 'dinheiro') return 'dinheiro';
    if (forma === 'pix') return 'pix';
    if (forma === 'cartao' || forma.includes('cartao')) return 'cartao';
    return 'outros';
  };

  async function buscarFechamento(tabela, colunas, colunaData, inicio, fim, filtro, consultaId) {
    const registros = [];
    let pagina = 0;
    const tamanho = 1000;
    while (true) {
      let consulta = supabaseClient.from(tabela)
        .select(colunas)
        .gte(colunaData, inicio)
        .lt(colunaData, fim);
      if (filtro) consulta = filtro(consulta);
      const { data, error } = await consulta
        .order(colunaData, { ascending: true })
        .order('id', { ascending: true })
        .range(pagina * tamanho, (pagina + 1) * tamanho - 1);
      if (error) throw error;
      if (!consultaAtiva() || consultaId !== fechamentoConsultaId) return null;
      const lote = data || [];
      registros.push(...lote);
      if (lote.length < tamanho) return registros;
      pagina++;
    }
  }

  fechamentoData.addEventListener('change', () => {
    fechamentoConsultaId++;
    fechamentoAtual = null;
    fechamentoImprimir.disabled = true;
    fechamentoResultado.textContent = 'Toque em Consultar dia para atualizar os valores.';
  });

  fechamentoConsultar.addEventListener('click', async () => {
    const texto = fechamentoData.value;
    const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
    if (!partes) {
      alert('Selecione uma data válida.');
      return;
    }
    const anoDia = Number(partes[1]);
    const mesDia = Number(partes[2]);
    const dia = Number(partes[3]);
    const inicio = new Date(anoDia, mesDia - 1, dia);
    if (anoDia < 2000 || anoDia > 2100 ||
        inicio.getFullYear() !== anoDia ||
        inicio.getMonth() !== mesDia - 1 ||
        inicio.getDate() !== dia) {
      alert('Selecione uma data entre 2000 e 2100.');
      return;
    }
    const fim = new Date(anoDia, mesDia - 1, dia + 1);
    const idConsulta = ++fechamentoConsultaId;
    fechamentoAtual = null;
    fechamentoImprimir.disabled = true;
    fechamentoConsultar.disabled = true;
    fechamentoResultado.textContent = 'Consultando o movimento do dia...';

    try {
      const [vendas, recebimentos, manuais] = await Promise.all([
        buscarFechamento('vendas', 'id,data,valor_total,forma_pagamento,status',
          'data', inicio.toISOString(), fim.toISOString(),
q => q.in('status', ['concluida', 'cancelada'])
  .in('forma_pagamento', ['dinheiro', 'pix', 'cartão', 'cartao']), idConsulta),
        buscarFechamento('recebimentos', 'id,valor,forma_pagamento,data_pagamento',
          'data_pagamento', inicio.toISOString(), fim.toISOString(), null, idConsulta),
        buscarFechamento('movimentacoes_caixa', 'id,tipo,categoria,descricao,valor,data',
          'data', inicio.toISOString(), fim.toISOString(), null, idConsulta)
      ]);
      if (!consultaAtiva() || idConsulta !== fechamentoConsultaId ||
          !vendas || !recebimentos || !manuais) return;

      const dados = {
        data: inicio.toLocaleDateString('pt-BR'),
        vendas: { dinheiro: 0, pix: 0, cartao: 0 },
        dividas: { dinheiro: 0, pix: 0, cartao: 0, outros: 0 },
 manuaisEntrada: 0, despesas: 0, veiculos: 0, estornos: 0,
        quantidadeVendas: vendas.length,
        quantidadeRecebimentos: recebimentos.length,
        quantidadeManuais: manuais.length
      };
      for (const venda of vendas) {
        const forma = fechamentoForma(venda.forma_pagamento);
        if (forma in dados.vendas) {
          dados.vendas[forma] += fechamentoDinheiro(venda.valor_total);
        }
      }
      for (const rec of recebimentos) {
        dados.dividas[fechamentoForma(rec.forma_pagamento)] +=
          fechamentoDinheiro(rec.valor);
      }
      for (const mov of manuais) {
        const tipo = String(mov.tipo || '').trim().toLowerCase();
        const centavos = fechamentoDinheiro(mov.valor);
        if (tipo === 'entrada') {
          dados.manuaisEntrada += centavos;
} else if (tipo === 'saida' || tipo === 'saída') {
  const categoria = String(mov.categoria || '').trim().toLowerCase();

  if (categoria === 'estorno_venda') {
    dados.estornos += centavos;
  } else {
    dados.despesas += centavos;
  }
          if (categoria.startsWith('veiculo_') ||
              ['veiculo', 'veículo', 'despesas_veiculo',
               'despesas com veiculo', 'despesas com veículo'].includes(categoria)) {
            dados.veiculos += centavos;
          }
        }
      }
      dados.totalVendas = Object.values(dados.vendas).reduce((a,b)=>a+b,0);
      dados.totalDividas = Object.values(dados.dividas).reduce((a,b)=>a+b,0);
      dados.entradas = dados.totalVendas + dados.totalDividas + dados.manuaisEntrada;
dados.totalSaidas = dados.despesas + dados.estornos;
dados.saldo = dados.entradas - dados.totalSaidas;
      const valor = centavos => money(centavos / 100);
      const linha = (rotulo, centavos) => `
        <div style="display:flex;justify-content:space-between;gap:12px;
          padding:7px 0;border-bottom:1px solid #e5e7eb">
          <span>${rotulo}</span><strong style="white-space:nowrap">${valor(centavos)}</strong>
        </div>`;
      const resumo = `
        <h4 style="margin:0 0 8px">Movimento de ${dados.data}</h4>
        <strong>Vendas recebidas no dia</strong>
        ${linha('Dinheiro', dados.vendas.dinheiro)}
        ${linha('Pix', dados.vendas.pix)}
        ${linha('Cartão', dados.vendas.cartao)}
        ${linha('Subtotal de vendas', dados.totalVendas)}
        <br><strong>Recebimentos de dívidas</strong>
        ${linha('Dinheiro', dados.dividas.dinheiro)}
        ${linha('Pix', dados.dividas.pix)}
        ${linha('Cartão', dados.dividas.cartao)}
        ${linha('Outras formas / não informada', dados.dividas.outros)}
        ${linha('Subtotal de dívidas', dados.totalDividas)}
        <br><strong>Outras movimentações</strong>
        ${linha('Entradas manuais', dados.manuaisEntrada)}
${linha('Despesas do dia', dados.despesas)}
${linha('Incluído nas despesas: veículos', dados.veiculos)}
${linha('Estornos de vendas', dados.estornos)}
        <div style="margin-top:14px;padding:12px;background:#eef5ff;border-radius:10px">
          ${linha('TOTAL DE ENTRADAS', dados.entradas)}
${linha('TOTAL DE SAÍDAS', dados.totalSaidas)}
          ${linha('SALDO DO DIA', dados.saldo)}
        </div>
        <p class="muted" style="font-size:12px;margin-top:12px">
          Relatório gerencial: cartão contabilizado na venda. O saldo não
          representa necessariamente o dinheiro físico disponível.
          Os gastos com veículos já estão incluídos nas despesas.
        </p>`;
      fechamentoAtual = { dados, resumo };
      fechamentoResultado.innerHTML = resumo;
      fechamentoImprimir.disabled = false;
    } catch (erro) {
      if (!consultaAtiva() || idConsulta !== fechamentoConsultaId) return;
      console.error('Erro no fechamento diário:', erro);
      fechamentoResultado.textContent =
        'Não foi possível consultar o dia: ' + (erro.message || 'Erro desconhecido');
    } finally {
      if (fechamentoConsultar.isConnected && idConsulta === fechamentoConsultaId) {
        fechamentoConsultar.disabled = false;
      }
    }
  });

  fechamentoImprimir.addEventListener('click', () => {
    if (!fechamentoAtual) return;
    const { dados, resumo } = fechamentoAtual;
    const janela = window.open('', '_blank');
    if (!janela) {
      alert('Permita janelas pop-up para imprimir o fechamento.');
      return;
    }
    const logo = new URL('logo-ponto-construcao.png', document.baseURI).href;
    janela.document.open();
    janela.document.write(`<!doctype html><html lang="pt-BR"><head>
      <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
      <title>Fechamento diário - ${dados.data}</title>
      <style>
        body{font:14px Arial,sans-serif;color:#172033;max-width:760px;margin:20px auto;padding:16px}
        header{display:flex;align-items:center;gap:16px;border-bottom:2px solid #123f87;padding-bottom:15px}
        header img{width:80px;max-height:80px;object-fit:contain}
        h1{font-size:21px;color:#123f87;margin:0}h4{font-size:18px}
        .acoes{margin-bottom:16px}.acoes button{padding:12px;border:0;border-radius:8px;background:#123f87;color:white}
        @media print{.acoes{display:none}body{margin:0;max-width:none}@page{size:A4;margin:12mm}}
      </style></head><body>
      <div class="acoes"><button onclick="window.print()">🖨️ Imprimir / Salvar PDF</button></div>
      <header><img src="${logo}" alt="Logo Ponto da Construção">
      <div><h1>PONTO DA CONSTRUÇÃO</h1><div>FECHAMENTO DIÁRIO DO CAIXA</div>
      <div>WhatsApp: (91) 98894-2001</div></div></header>
      <main style="margin-top:20px">${resumo}</main>
      <p style="font-size:11px;color:#64748b;margin-top:22px">
        Consulta emitida em ${new Date().toLocaleString('pt-BR')}. Nenhum lançamento foi criado.
      </p></body></html>`);
    janela.document.close();
    janela.focus();
  });

  // =====================================
  // ABRIR E FECHAR FORMULÁRIO
  // =====================================

  function abrirFormulario() {

    formulario.style.display = 'block';
    botaoNovo.style.display = 'none';

    formulario.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest'
    });
  }

  function fecharFormulario() {

    if (botaoSalvar.disabled) return;

    formulario.style.display = 'none';
    botaoNovo.style.display = '';

    tipoInput.value = 'saida';
    atualizarCategorias();

    descricaoInput.value = '';
    valorInput.value = '';
    dataInput.value = dataLocalFormatada(new Date());
  }

  botaoNovo.addEventListener(
    'click',
    abrirFormulario
  );

  campo('caixaFecharFormulario').addEventListener(
    'click',
    fecharFormulario
  );

  campo('caixaCancelarMovimentacao').addEventListener(
    'click',
    fecharFormulario
  );

  // =====================================
  // CONSULTAR OUTRO MÊS
  // =====================================

  campo('caixaConsultarPeriodo').addEventListener(
    'click',
    () => {

      if (botaoSalvar.disabled) return;

      const novoMes = Number(
        campo('caixaFiltroMes').value
      );

      const novoAno = Number(
        campo('caixaFiltroAno').value
      );

      if (
        !Number.isInteger(novoMes) ||
        novoMes < 1 ||
        novoMes > 12 ||
        !Number.isInteger(novoAno) ||
        novoAno < 2000 ||
        novoAno > 2100
      ) {
        alert('Selecione um período válido.');
        return;
      }

      window.caixaMesSelecionado = novoMes;
      window.caixaAnoSelecionado = novoAno;

      renderCash(el);
    }
  );

  // =====================================
  // SALVAR MOVIMENTAÇÃO
  // =====================================

  botaoSalvar.addEventListener('click', async () => {

    if (botaoSalvar.disabled) return;

    const tipo = tipoInput.value;
    const categoria = categoriaInput.value;
    const descricao = descricaoInput.value.trim();

    const valorTexto = String(
      valorInput.value || ''
    ).replace(',', '.');

    const valor = Number(valorTexto);

    const dataInformada = dataInput.value;

    if (!['entrada', 'saida'].includes(tipo)) {
      alert('Selecione um tipo válido.');
      return;
    }

    const categoriasPermitidas =
      tipo === 'entrada'
        ? categoriasEntrada
        : categoriasSaida;

    if (
      !categoriasPermitidas.some(
        c => c.valor === categoria
      )
    ) {
      alert('Selecione uma categoria válida.');
      return;
    }

    if (!descricao) {
      alert('Informe a descrição da movimentação.');
      descricaoInput.focus();
      return;
    }

    if (
      !Number.isFinite(valor) ||
      valor <= 0 ||
      Math.round(valor * 100) !== valor * 100
    ) {
      alert('Informe um valor válido com até duas casas decimais.');
      valorInput.focus();
      return;
    }

    const centavos = Math.round(valor * 100);
    const valorFinal = centavos / 100;

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(dataInformada)
    ) {
      alert('Informe uma data válida.');
      return;
    }

    const partes = dataInformada
      .split('-')
      .map(Number);

    const dataEscolhida = new Date(
      partes[0],
      partes[1] - 1,
      partes[2],
      12,
      0,
      0
    );

    if (
      dataEscolhida.getFullYear() !== partes[0] ||
      dataEscolhida.getMonth() !== partes[1] - 1 ||
      dataEscolhida.getDate() !== partes[2] ||
      partes[0] < 2000 ||
      partes[0] > 2100
    ) {
      alert('Informe uma data entre 2000 e 2100.');
      return;
    }

    const categoriaNome =
      categoriasPermitidas.find(
        c => c.valor === categoria
      )?.nome || categoria;

    const confirmado = confirm(
      'Confirma este lançamento?\n\n' +
      'Tipo: ' + (tipo === 'entrada' ? 'Entrada' : 'Saída') +
      '\nCategoria: ' + categoriaNome +
      '\nDescrição: ' + descricao +
      '\nValor: ' + money(valorFinal) +
      '\nData: ' + dataEscolhida.toLocaleDateString('pt-BR')
    );

    if (!confirmado) return;

    botaoSalvar.disabled = true;
    botaoSalvar.textContent = 'Salvando...';

    try {

      const { data: usuarioAuth, error: erroAuth } =
        await supabaseClient.auth.getUser();

      if (erroAuth || !usuarioAuth?.user?.id) {
        throw new Error(
          'Sua sessão expirou. Entre novamente no sistema.'
        );
      }

      const { error } = await supabaseClient
        .from('movimentacoes_caixa')
        .insert({
          tipo,
          categoria,
          descricao,
          valor: valorFinal,
          data: dataEscolhida.toISOString(),
          responsavel_id: usuarioAuth.user.id
        });

      if (error) throw error;

      alert('Movimentação registrada com sucesso!');

      // Abrir automaticamente o mês do lançamento.
      window.caixaMesSelecionado = partes[1];
      window.caixaAnoSelecionado = partes[0];

      if (state.page === 'cash' && el.isConnected) {
        await renderCash(el);
      }

    } catch (erro) {

      console.error(
        'Erro ao salvar movimentação:',
        erro
      );

      alert(
        'Não foi possível salvar a movimentação.\n\n' +
        (erro.message || 'Erro desconhecido.')
      );

    } finally {

      if (botaoSalvar.isConnected) {
        botaoSalvar.disabled = false;
        botaoSalvar.textContent = '💾 Salvar movimentação';
      }
    }
  });

  // =====================================
  // INTERVALO DO MÊS
  // =====================================

  const inicioMes = new Date(ano, mes - 1, 1);
  const inicioProximoMes = new Date(ano, mes, 1);

  // =====================================
  // CARREGAR MOVIMENTAÇÕES
  // =====================================

  try {

    const movimentacoes = [];
    const tamanhoPagina = 1000;

    let pagina = 0;

    while (true) {

      const inicio = pagina * tamanhoPagina;
      const fim = inicio + tamanhoPagina - 1;

      const { data, error } = await supabaseClient
        .from('movimentacoes_caixa')
        .select(`
          id,
          tipo,
          categoria,
          descricao,
          valor,
          data,
          created_at
        `)
        .gte('data', inicioMes.toISOString())
        .lt('data', inicioProximoMes.toISOString())
        .order('data', { ascending: false })
        .order('id', { ascending: false })
        .range(inicio, fim);

      if (error) throw error;

      if (!consultaAtiva()) return;

      const lote = data || [];
      movimentacoes.push(...lote);

      if (lote.length < tamanhoPagina) break;

      pagina++;
    }

    if (!consultaAtiva()) return;

    // =====================================
    // CONSULTAR VENDAS E RECEBIMENTOS
    // =====================================

    async function buscarRegistrosFinanceiros(
      tabela, colunas, campoData, aplicarFiltros
    ) {
      const registros = [];
      const tamanho = 1000;
      let pagina = 0;

      while (true) {
        const inicio = pagina * tamanho;
        const fim = inicio + tamanho - 1;

        let consulta = supabaseClient
          .from(tabela)
          .select(colunas)
          .gte(campoData, inicioMes.toISOString())
          .lt(campoData, inicioProximoMes.toISOString());

        if (aplicarFiltros) {
          consulta = aplicarFiltros(consulta);
        }

        const { data, error } = await consulta
          .order(campoData, { ascending: true })
          .order('id', { ascending: true })
          .range(inicio, fim);

        if (error) throw error;
        if (!consultaAtiva()) return null;

        const lote = data || [];
        registros.push(...lote);
        if (lote.length < tamanho) break;
        pagina++;
      }

      return registros;
    }

    const vendasCaixa = await buscarRegistrosFinanceiros(
      'vendas',
      'id,data,valor_total,forma_pagamento,status',
      'data',
consulta => consulta
  .in('status', ['concluida', 'cancelada'])
  .in('forma_pagamento', ['dinheiro', 'pix', 'cartão', 'cartao'])
    );

    if (!consultaAtiva()) return;

    const recebimentosCaixa = await buscarRegistrosFinanceiros(
      'recebimentos',
      'id,valor,forma_pagamento,data_pagamento,conta_receber_id',
      'data_pagamento'
    );

    if (!consultaAtiva()) return;

    function somarCentavos(registros, coluna) {
      return (registros || []).reduce((soma, registro) => {
        const valor = Number(registro[coluna]);
        if (!Number.isFinite(valor) || valor <= 0) return soma;
        return soma + Math.round(valor * 100);
      }, 0);
    }

    const entradasAutomaticasCentavos =
      somarCentavos(vendasCaixa, 'valor_total') +
      somarCentavos(recebimentosCaixa, 'valor');

    // =====================================
    // CALCULAR INDICADORES
    // =====================================

let entradasCentavos = 0;
let saidasCentavos = 0;
let veiculoCentavos = 0;
let estornosCentavos = 0;
    function ehCategoriaVeiculo(categoria) {

      const texto = String(
        categoria || ''
      ).trim().toLowerCase();

      return (
        texto === 'veiculo' ||
        texto === 'veículo' ||
        texto === 'despesas_veiculo' ||
        texto === 'despesas com veiculo' ||
        texto === 'despesas com veículo' ||
        texto.startsWith('veiculo_')
      );
    }

    for (const movimento of movimentacoes) {

      const tipo = String(
        movimento.tipo || ''
      ).trim().toLowerCase();

      const valor = Number(movimento.valor);

      if (
        !Number.isFinite(valor) ||
        valor <= 0
      ) {
        continue;
      }

      const centavos = Math.round(valor * 100);

      if (tipo === 'entrada') {
        entradasCentavos += centavos;
      }

if (tipo === 'saida' || tipo === 'saída') {

  saidasCentavos += centavos;

  const categoria = String(
    movimento.categoria || ''
  ).trim().toLowerCase();

  if (categoria === 'estorno_venda') {
    estornosCentavos += centavos;
  }

  if (ehCategoriaVeiculo(categoria)) {
    veiculoCentavos += centavos;
  }
}
    }

    // Entradas automáticas somadas uma única vez ao resumo.
    entradasCentavos += entradasAutomaticasCentavos;

    campo('caixaEntradas').textContent =
      money(entradasCentavos / 100);

    campo('caixaSaidas').textContent =
      money(saidasCentavos / 100);
    campo('caixaEstornos').textContent =
  money(estornosCentavos / 100);

    campo('caixaSaldo').textContent =
      money(
        (entradasCentavos - saidasCentavos) / 100
      );

    campo('caixaGastosVeiculo').textContent =
      money(veiculoCentavos / 100);

    // =====================================
    // HISTÓRICO
    // =====================================

    const historico = campo('caixaHistorico');

const nomesCategorias = {
  despesa_geral: 'Despesa geral',
  outra_entrada: 'Outra entrada',
  estorno_venda: 'Estornos de vendas',
      veiculo: 'Despesa do veículo',
      veiculo_combustivel: 'Combustível',
      veiculo_pneus: 'Pneus',
      veiculo_manutencao: 'Manutenção / Oficina',
      veiculo_oleo: 'Troca de óleo',
      veiculo_documentacao: 'Documentação / Seguro',
      veiculo_outros: 'Outras despesas do veículo'
    };

    const nomesPagamento = {
      dinheiro: 'Dinheiro',
      pix: 'Pix',
      'cartão': 'Cartão',
      cartao: 'Cartão'
    };

    // Apenas monta o histórico: não grava novos lançamentos.
    // As mesmas vendas e recebimentos já compõem os indicadores.
    const itensHistorico = [];

    for (const m of movimentacoes) {
      const tipo = String(m.tipo || '').trim().toLowerCase();
      const entrada = tipo === 'entrada';
      const veiculo = !entrada && ehCategoriaVeiculo(m.categoria);
      const categoria = String(m.categoria || '');

      itensHistorico.push({
        origem: 'manual',
        id: m.id,
        data: m.data || m.created_at,
titulo: entrada
  ? '🟢 Entrada manual'
  : categoria === 'estorno_venda'
    ? '↩️ Estorno de venda'
    : veiculo
      ? '🚚 Despesa do veículo'
      : '🔴 Saída manual',
        descricao: m.descricao || 'Sem descrição',
        detalhe: nomesCategorias[categoria] || categoria || 'Sem categoria',
        valor: Number(m.valor) || 0
      });
    }

    for (const venda of vendasCaixa || []) {
      const forma = String(venda.forma_pagamento || '').toLowerCase();
      itensHistorico.push({
        origem: 'venda',
        id: venda.id,
        data: venda.data,
        titulo: '🟢 Venda recebida',
        descricao: `Venda #${venda.id}`,
        detalhe: `Pagamento: ${nomesPagamento[forma] || forma}`,
        valor: Number(venda.valor_total) || 0
      });
    }

    for (const recebimento of recebimentosCaixa || []) {
      const forma = String(recebimento.forma_pagamento || '').toLowerCase();
      itensHistorico.push({
        origem: 'recebimento',
        id: recebimento.id,
        data: recebimento.data_pagamento,
        titulo: '💰 Recebimento de dívida',
        descricao: `Pagamento da conta #${recebimento.conta_receber_id}`,
        detalhe: `Pagamento: ${nomesPagamento[forma] || forma || 'Não informado'}`,
        valor: Number(recebimento.valor) || 0
      });
    }

    // Data decrescente; desempate estável por origem e ID.
    itensHistorico.sort((a, b) => {
      const tempoA = new Date(a.data).getTime() || 0;
      const tempoB = new Date(b.data).getTime() || 0;
      if (tempoA !== tempoB) return tempoB - tempoA;
      const origem = a.origem.localeCompare(b.origem);
      if (origem !== 0) return origem;
      return Number(b.id) - Number(a.id);
    });

    if (!itensHistorico.length) {
      historico.innerHTML = `
        <div class="card">
          <strong>Nenhuma movimentação neste período.</strong>
          <p class="muted">
            Não existem lançamentos em ${meses[mes - 1]} de ${ano}.
          </p>
        </div>
      `;
      return;
    }

    historico.innerHTML = itensHistorico.map(item => {
      const dataObj = new Date(item.data);
      const dataFormatada = Number.isNaN(dataObj.getTime())
        ? 'Data não informada'
        : dataObj.toLocaleString('pt-BR');

      return `
        <div class="card">
          <div class="row">
            <strong>${pcEscapar(item.titulo)}</strong>
            <strong>${money(item.valor)}</strong>
          </div>
          <p style="margin:10px 0 5px">
            ${pcEscapar(item.descricao)}
          </p>
          <div class="muted" style="font-size:13px">
            ${pcEscapar(item.detalhe)}
          </div>
          <div class="muted" style="font-size:12px;margin-top:7px">
            📅 ${pcEscapar(dataFormatada)}
          </div>
        </div>
      `;
    }).join('');

  } catch (erro) {

    console.error(
      'Erro ao carregar Caixa:',
      erro
    );

    if (!consultaAtiva()) return;

    [
      'caixaEntradas',
      'caixaSaidas',
     'caixaEstornos',
      'caixaSaldo',
      'caixaGastosVeiculo'
    ].forEach(id => {

      const elemento = campo(id);

      if (elemento) {
        elemento.textContent = 'Indisponível';
      }
    });

    campo('caixaHistorico').innerHTML = `
      <div class="card">
        <strong>
          Não foi possível carregar o Caixa.
        </strong>

        <p class="muted">
          ${pcEscapar(
            erro.message || 'Erro na consulta.'
          )}
        </p>
      </div>
    `;
  }
}






function renderMore(el) {

  const ehAdministrador =
    state.user?.tipo === 'admin' ||
    state.user?.tipo === 'administrador';

  el.innerHTML = `
    <div class="list">

      <button class="card" onclick="navigate('clients')">
        <strong>Clientes</strong>
        <span class="muted">Cadastro e histórico</span>
      </button>

      ${ehAdministrador ? `
        <button class="card" onclick="navigate('receivables')">
          <strong>💰 Contas a receber</strong>
          <span class="muted">
            Dívidas dos clientes e registro de pagamentos
          </span>
        </button>
      ` : ''}

      <button class="card" onclick="navigate('cash')">
        <strong>Caixa / Financeiro</strong>
        <span class="muted">Entradas, saídas e saldo</span>
      </button>

      <button class="card" onclick="navigate('reports')">
        <strong>Relatórios</strong>
        <span class="muted">Resumo de vendas e operação</span>
      </button>
   
            ${ehAdministrador ? `
        <button class="card" onclick="navigate('observations')">
          <strong>📝 Observações</strong>
          <span class="muted">
            Anotações, lembretes, datas e horários
          </span>
        </button>
      ` : ''}

      <button class="card" onclick="navigate('settings')">
        <strong>Configurações</strong>
        <span class="muted">Usuários e preferências</span>
      </button>

    </div>
  `;
}


async function renderReceivables(el) {

  const ehAdministrador =
    state.user?.tipo === 'admin' ||
    state.user?.tipo === 'administrador';

  if (!ehAdministrador) {
    el.innerHTML = `
      <div class="card">
        <h2>Acesso restrito</h2>
        <p class="muted">
          Esta área é exclusiva dos administradores.
        </p>
      </div>
    `;
    return;
  }

  // =====================================
  // ESTRUTURA DA TELA
  // =====================================

  el.innerHTML = `
    <div class="section-title">
      <h2>💰 Contas a receber</h2>
    </div>


    <div class="card">
      <div class="label">Total em aberto</div>

      <div
        id="receivablesTotal"
        style="
          font-size:28px;
          font-weight:bold;
          margin-top:8px;
        "
      >
        Carregando...
      </div>
    </div>

    <div class="section-title">
      <h2>Dívidas dos clientes</h2>
    </div>

    <div id="receivablesList">
      <div class="card muted">
        Carregando contas...
      </div>
    </div>

    <div id="receivablesPaidSection"></div>
  `;

  const lista = el.querySelector('#receivablesList');
  const campoTotal = el.querySelector('#receivablesTotal');
  const secaoPagas = el.querySelector(
    '#receivablesPaidSection'
  );

  // =====================================
  // CONSULTAR CONTAS
  // =====================================

  try {

    const contas = [];
    const tamanhoPagina = 1000;
    let pagina = 0;

    while (true) {

      const inicio = pagina * tamanhoPagina;

      const { data, error } = await supabaseClient
        .from('contas_receber')
        .select(`
          id,
          venda_id,
          cliente_id,
          valor_original,
          valor_recebido,
          vencimento,
          status
        `)
        .order('id', { ascending: false })
        .range(inicio, inicio + tamanhoPagina - 1);

      if (error) throw error;

      const lote = data || [];

      contas.push(...lote);

      if (lote.length < tamanhoPagina) break;

      pagina++;
    }

    // =====================================
    // CONSULTAR CLIENTES
    // =====================================

    const clientesPorId = new Map();

    const idsClientes = [
      ...new Set(
        contas
          .map(conta => conta.cliente_id)
          .filter(Boolean)
      )
    ];

    for (
      let i = 0;
      i < idsClientes.length;
      i += 100
    ) {

      const { data, error } = await supabaseClient
        .from('clientes')
        .select('id,nome,telefone')
        .in('id', idsClientes.slice(i, i + 100));

      if (error) throw error;

      for (const cliente of data || []) {
        clientesPorId.set(
          String(cliente.id),
          cliente
        );
      }
    }

    // =====================================
    // CONSULTAR HISTÓRICO DE PAGAMENTOS
    // =====================================

    const pagamentosPorConta = new Map();

    const idsContas = contas.map(conta => conta.id);

    for (
      let i = 0;
      i < idsContas.length;
      i += 100
    ) {

      const idsLote = idsContas.slice(i, i + 100);
      let paginaPagamentos = 0;

      while (true) {

        const inicio = paginaPagamentos * tamanhoPagina;

        const { data, error } = await supabaseClient
          .from('recebimentos')
          .select(`
            id,
            conta_receber_id,
            valor,
            forma_pagamento,
            data_pagamento
          `)
          .in('conta_receber_id', idsLote)
          .order('id', { ascending: false })
          .range(inicio, inicio + tamanhoPagina - 1);

        if (error) throw error;

        const pagamentos = data || [];

        for (const pagamento of pagamentos) {

          const chave = String(
            pagamento.conta_receber_id
          );

          if (!pagamentosPorConta.has(chave)) {
            pagamentosPorConta.set(chave, []);
          }

          pagamentosPorConta.get(chave).push(
            pagamento
          );
        }

        if (pagamentos.length < tamanhoPagina) {
          break;
        }

        paginaPagamentos++;
      }
    }

    if (
      state.page !== 'receivables' ||
      !el.isConnected
    ) {
      return;
    }

    // =====================================
    // ORGANIZAR VALORES
    // =====================================

    let totalEmAberto = 0;

    const contasPreparadas = contas.map(conta => {

      const original = Number(conta.valor_original);
      const recebido = Number(conta.valor_recebido);

      const valoresValidos =
        Number.isFinite(original) &&
        Number.isFinite(recebido);

      const saldo = valoresValidos
        ? Math.max(0, original - recebido)
        : 0;

      if (valoresValidos) {
        totalEmAberto += saldo;
      }

      return {
        ...conta,
        saldo,
        valoresValidos
      };
    });

    const abertas = contasPreparadas.filter(
      conta => conta.saldo > 0 && conta.valoresValidos
    );

    const pagas = contasPreparadas.filter(
      conta => conta.saldo === 0 && conta.valoresValidos
    );

    campoTotal.textContent = money(totalEmAberto);

    // =====================================
    // MONTAR CARTÃO DE CADA CONTA
    // =====================================

    function montarCartao(conta) {

      const cliente = clientesPorId.get(
        String(conta.cliente_id)
      );

      const nome = pcEscapar(
        cliente?.nome || 'Cliente não identificado'
      );

      const telefone = pcEscapar(
        cliente?.telefone || 'Telefone não informado'
      );

      const status = conta.saldo === 0
        ? 'Pago'
        : Number(conta.valor_recebido) > 0
          ? 'Pagamento parcial'
          : 'Pendente';

      const vencimento = conta.vencimento
        ? conta.vencimento.split('-').reverse().join('/')
        : 'Não informado';

      const pagamentos = pagamentosPorConta.get(
        String(conta.id)
      ) || [];

      const historico = pagamentos.length
        ? pagamentos.map(pagamento => {

            const data = new Date(
              pagamento.data_pagamento
            );

            const dataFormatada =
              Number.isNaN(data.getTime())
                ? 'Data não informada'
                : data.toLocaleString('pt-BR');

            const forma = {
              dinheiro: 'Dinheiro',
              pix: 'Pix',
              'cartão': 'Cartão'
            }[pagamento.forma_pagamento] ||
              pagamento.forma_pagamento;

            return `
              <div
                style="
                  padding:10px 0;
                  border-bottom:1px solid #e2e8f0;
                "
              >
                <strong>
                  ${money(Number(pagamento.valor))}
                </strong>

                <div class="muted">
                  ${pcEscapar(forma)}
                  · ${pcEscapar(dataFormatada)}
                </div>
              </div>
            `;
          }).join('')
        : `
          <p class="muted">
            Nenhum pagamento registrado.
          </p>
        `;

      const idConta = Number(conta.id);

      const podeRegistrar =
        conta.saldo > 0 &&
        Number.isSafeInteger(idConta) &&
        idConta > 0;

      return `
        <div class="card" style="margin-bottom:14px">

          <div class="row">
            <strong>${nome}</strong>
            <span class="badge">
              ${status}
            </span>
          </div>

          <p class="muted">${telefone}</p>

          <p class="muted">
            Venda #${pcEscapar(conta.venda_id)}
          </p>

          <div style="margin-top:12px">
            Valor da compra:
            <strong>
              ${money(Number(conta.valor_original))}
            </strong>
          </div>

          <div style="margin-top:6px">
            Valor recebido:
            <strong>
              ${money(Number(conta.valor_recebido))}
            </strong>
          </div>

          <div style="margin-top:8px">
            Saldo devedor:
            <strong style="font-size:20px">
              ${money(conta.saldo)}
            </strong>
          </div>

          <p class="muted" style="margin-top:10px">
            Vencimento: ${pcEscapar(vencimento)}
          </p>

          ${podeRegistrar ? `
            <details style="margin-top:16px">

              <summary
                style="
                  cursor:pointer;
                  font-weight:bold;
                  padding:10px 0;
                "
              >
                💵 Registrar pagamento
              </summary>

              <form
                class="pc-form-recebimento"
                data-conta-id="${idConta}"
                style="
                  margin-top:12px;
                  display:grid;
                  gap:12px;
                "
              >

                <label>
                  Valor recebido (R$)

                  <input
                    name="valor"
                    type="number"
                    min="0.01"
                    max="${conta.saldo.toFixed(2)}"
                    step="0.01"
                    required
                    placeholder="0,00"
                    style="width:100%;margin-top:6px"
                  >
                </label>

                <label>
                  Forma de pagamento

                  <select
                    name="forma"
                    required
                    style="width:100%;margin-top:6px"
                  >
                    <option value="pix">Pix</option>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="cartão">Cartão</option>
                  </select>
                </label>

                <p class="muted">
                  Saldo disponível para pagamento:
                  ${money(conta.saldo)}
                </p>

                <button
                  type="submit"
                  class="primary"
                >
                  Confirmar pagamento
                </button>

              </form>

            </details>
          ` : ''}

          <details style="margin-top:16px">

            <summary
              style="
                cursor:pointer;
                font-weight:bold;
                padding:10px 0;
              "
            >
              📋 Histórico de pagamentos
              (${pagamentos.length})
            </summary>

            <div style="margin-top:10px">
              ${historico}
            </div>

          </details>

        </div>
      `;
    }

    // =====================================
    // MOSTRAR DÍVIDAS EM ABERTO
    // =====================================

    lista.innerHTML = abertas.length
      ? abertas.map(montarCartao).join('')
      : `
        <div class="card">
          <p class="muted">
            Nenhuma dívida em aberto.
          </p>
        </div>
      `;

    // =====================================
    // MOSTRAR CONTAS QUITADAS
    // =====================================

    secaoPagas.innerHTML = pagas.length
      ? `
        <div class="section-title">
          <h2>Contas quitadas</h2>
        </div>

        <details>
          <summary
            style="
              cursor:pointer;
              padding:12px 0;
              font-weight:bold;
            "
          >
            Ver ${pagas.length} conta(s) quitada(s)
          </summary>

          <div style="margin-top:12px">
            ${pagas.map(montarCartao).join('')}
          </div>
        </details>
      `
      : '';

    // =====================================
    // REGISTRAR PAGAMENTO PELO SUPABASE
    // =====================================

    lista.addEventListener('submit', async evento => {

      const formulario = evento.target.closest(
        '.pc-form-recebimento'
      );

      if (!formulario) return;

      evento.preventDefault();

      if (formulario.dataset.salvando === 'true') {
        return;
      }

      const contaId = Number(
        formulario.dataset.contaId
      );

      const conta = abertas.find(
        item => Number(item.id) === contaId
      );

      if (!conta) {
        alert('Conta não encontrada. Atualize a página.');
        return;
      }

      const campoValor = formulario.elements.valor;
      const campoForma = formulario.elements.forma;

      const valorTexto = String(
        campoValor.value || ''
      ).replace(',', '.');

      const valor = Number(valorTexto);

      const forma = campoForma.value;

      if (
        !Number.isFinite(valor) ||
        valor <= 0 ||
        Math.round(valor * 100) !== valor * 100
      ) {
        alert('Informe um valor válido com até 2 casas decimais.');
        return;
      }

      const valorCentavos = Math.round(valor * 100);
      const saldoCentavos = Math.round(
        conta.saldo * 100
      );

      if (valorCentavos > saldoCentavos) {
        alert('O pagamento não pode ultrapassar o saldo devedor.');
        return;
      }

      if (!['dinheiro', 'pix', 'cartão'].includes(forma)) {
        alert('Selecione uma forma de pagamento válida.');
        return;
      }

      const nomeCliente =
        clientesPorId.get(String(conta.cliente_id))
          ?.nome || 'Cliente não identificado';

      const formaTexto = {
        dinheiro: 'Dinheiro',
        pix: 'Pix',
        'cartão': 'Cartão'
      }[forma];

      const confirmado = confirm(
        'Confirmar recebimento?\n\n' +
        'Cliente: ' + nomeCliente + '\n' +
        'Venda: #' + conta.venda_id + '\n' +
        'Valor: ' + money(valorCentavos / 100) + '\n' +
        'Forma: ' + formaTexto + '\n\n' +
        'Esta operação será registrada no Supabase.'
      );

      if (!confirmado) return;

      const botao = formulario.querySelector(
        'button[type="submit"]'
      );

      formulario.dataset.salvando = 'true';

      botao.disabled = true;
      botao.textContent = 'Registrando...';

      try {

        const { error } = await supabaseClient.rpc(
          'registrar_recebimento',
          {
            p_conta_receber_id: contaId,
            p_valor: valorCentavos / 100,
            p_forma_pagamento: forma
          }
        );

        if (error) throw error;

        alert(
          'Pagamento registrado com sucesso!\n\n' +
          'Valor: ' + money(valorCentavos / 100)
        );

        if (
          state.page === 'receivables' &&
          el.isConnected
        ) {
          await renderReceivables(el);
        }

      } catch (erro) {

        console.error(
          'Erro ao registrar pagamento:',
          erro
        );

        alert(
          'Não foi possível registrar o pagamento.\n\n' +
          (erro.message || 'Erro desconhecido')
        );

        botao.disabled = false;
        botao.textContent = 'Confirmar pagamento';

        formulario.dataset.salvando = 'false';
      }

    });

  } catch (erro) {

    console.error(
      'Erro ao carregar contas a receber:',
      erro
    );

    if (
      state.page !== 'receivables' ||
      !el.isConnected
    ) {
      return;
    }

    campoTotal.textContent = 'Indisponível';

    lista.innerHTML = `
      <div class="card">
        <strong>
          Não foi possível carregar as contas.
        </strong>

        <p class="muted">
          ${pcEscapar(erro.message || 'Erro desconhecido')}
        </p>
      </div>
    `;
  }
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

  window.clienteLatitude = null;
window.clienteLongitude = null;
  
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




async function renderClients(el) {

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

    <div id="pcHistoricoCliente"></div>
  `;

  const { data, error } = await supabaseClient
    .from('clientes')
    .select('*')
    .order('nome', { ascending: true });

  if (state.page !== 'clients' || !el.isConnected) {
    return;
  }

  const lista = el.querySelector('#clientsList');

  if (error) {
    lista.innerHTML = `
      <div class="card">
        <strong>Erro ao carregar clientes</strong>
        <p class="muted">${pcEscapar(error.message)}</p>
      </div>
    `;
    return;
  }

  window.currentClients = data || [];

  filterClients();

  lista.addEventListener('click', async evento => {

    // =====================================
    // EDITAR ENDEREÇO DO CLIENTE
    // =====================================

    const botaoEditarEndereco = evento.target.closest(
      '[data-cliente-editar-endereco]'
    );

    if (botaoEditarEndereco) {

      const cliente = window.currentClients.find(
        c => String(c.id) ===
          botaoEditarEndereco.dataset.clienteEditarEndereco
      );

      if (!cliente) {
        alert('Cliente não encontrado.');
        return;
      }

      await editarEnderecoCliente(cliente);
      return;
    }

    // =====================================
    // EXCLUIR CLIENTE
    // =====================================
    const botaoExcluir = evento.target.closest(
      '[data-cliente-excluir]'
    );

    if (botaoExcluir) {

      await excluirCliente(
        botaoExcluir.dataset.clienteExcluir
      );

      return;
    }

    // =====================================
    // HISTÓRICO DE COMPRAS
    // =====================================

    const botao = evento.target.closest(
      '[data-cliente-historico]'
    );

    if (!botao) return;

    const cliente = window.currentClients.find(
      c => String(c.id) === botao.dataset.clienteHistorico
    );

    if (!cliente) {
      alert('Cliente não encontrado.');
      return;
    }

    const painel = el.querySelector('#pcHistoricoCliente');

    painel.innerHTML = `
      <div class="card">
        <strong>Carregando histórico de compras...</strong>
      </div>
    `;

    painel.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });

    try {

      // =====================================
      // VENDAS DO CLIENTE
      // =====================================

      const vendas = [];
      let pagina = 0;
      const tamanhoPagina = 1000;

      while (true) {

        const inicio = pagina * tamanhoPagina;

        const { data, error } = await supabaseClient
          .from('vendas')
          .select(`
            id,
            data,
            valor_total,
            forma_pagamento,
            status
          `)
          .eq('cliente_id', cliente.id)
          .order('id', { ascending: false })
          .range(inicio, inicio + tamanhoPagina - 1);

        if (error) throw error;

        const lote = data || [];
        vendas.push(...lote);

        if (lote.length < tamanhoPagina) break;

        pagina++;
      }

      // =====================================
      // CONTAS A RECEBER DO CLIENTE
      // =====================================

      const contas = [];
      pagina = 0;

      while (true) {

        const inicio = pagina * tamanhoPagina;

        const { data, error } = await supabaseClient
          .from('contas_receber')
          .select(`
            id,
            venda_id,
            valor_original,
            valor_recebido,
            status
          `)
          .eq('cliente_id', cliente.id)
          .order('id', { ascending: false })
          .range(inicio, inicio + tamanhoPagina - 1);

        if (error) throw error;

        const lote = data || [];
        contas.push(...lote);

        if (lote.length < tamanhoPagina) break;

        pagina++;
      }

      if (state.page !== 'clients' || !painel.isConnected) {
        return;
      }

      const contasPorVenda = new Map(
        contas.map(conta => [
          String(conta.venda_id),
          conta
        ])
      );

      const totalCompras = vendas.reduce(
        (soma, venda) =>
          soma + Number(venda.valor_total || 0),
        0
      );

      const totalDevedor = contas.reduce(
        (soma, conta) => soma + Math.max(
          0,
          Number(conta.valor_original || 0) -
          Number(conta.valor_recebido || 0)
        ),
        0
      );

      const formatarData = valor => {

        const data = new Date(valor);

        return Number.isNaN(data.getTime())
          ? 'Data não informada'
          : data.toLocaleString('pt-BR');
      };

      const formas = {
        dinheiro: 'Dinheiro',
        pix: 'Pix',
        'cartão': 'Cartão',
        prazo: 'A prazo'
      };

      painel.innerHTML = `
        <div class="section-title">
          <h2>
            📋 Histórico de ${pcEscapar(cliente.nome)}
          </h2>

          <button
            type="button"
            class="secondary"
            id="pcFecharHistorico"
          >
            Fechar
          </button>
        </div>

        <div class="grid stats">

          <div class="card stat">
            <div class="label">Total de compras</div>
            <div class="value">
              ${money(totalCompras)}
            </div>
          </div>

          <div class="card stat">
            <div class="label">Saldo devedor</div>
            <div class="value">
              ${money(totalDevedor)}
            </div>
          </div>

        </div>

        <div class="section-title">
          <h2>Compras realizadas (${vendas.length})</h2>
        </div>

        ${
          vendas.length
            ? vendas.map(venda => {

                const conta = contasPorVenda.get(
                  String(venda.id)
                );

                const saldo = conta
                  ? Math.max(
                      0,
                      Number(conta.valor_original) -
                      Number(conta.valor_recebido)
                    )
                  : 0;

                const situacao = conta
                  ? saldo === 0
                    ? 'Quitada'
                    : Number(conta.valor_recebido) > 0
                      ? 'Pagamento parcial'
                      : 'Pendente'
                  : venda.forma_pagamento === 'prazo'
                    ? 'Conta não localizada'
                    : 'Venda sem dívida a prazo';

                return `
                  <div
                    class="card"
                    style="margin-bottom:12px"
                  >
                    <div class="row">
                      <strong>
                        Venda #${pcEscapar(venda.id)}
                      </strong>

                      <strong>
                        ${money(Number(venda.valor_total))}
                      </strong>
                    </div>

                    <p class="muted">
                      ${formatarData(venda.data)}
                    </p>

                    <p>
                      Pagamento:
                      <strong>
                        ${pcEscapar(
                          formas[venda.forma_pagamento] ||
                          venda.forma_pagamento ||
                          'Não informado'
                        )}
                      </strong>
                    </p>

                    <p>
                      Situação financeira:
                      <strong>${situacao}</strong>
                    </p>

                    ${
                      conta
                        ? `
                          <p>
                            Valor recebido:
                            <strong>
                              ${money(Number(conta.valor_recebido))}
                            </strong>
                          </p>

                          <p>
                            Saldo devedor:
                            <strong>${money(saldo)}</strong>
                          </p>
                        `
                        : ''
                    }
                  </div>
                `;
              }).join('')
            : `
              <div class="card">
                <p class="muted">
                  Este cliente ainda não possui compras
                  registradas.
                </p>
              </div>
            `
        }
      `;

      painel.querySelector('#pcFecharHistorico')
        .addEventListener('click', () => {
          painel.innerHTML = '';
          el.querySelector('#clientSearch')?.focus();
        });

    } catch (erro) {

      console.error(
        'Erro ao carregar histórico do cliente:',
        erro
      );

      if (painel.isConnected) {
        painel.innerHTML = `
          <div class="card">
            <strong>
              Não foi possível carregar o histórico.
            </strong>
            <p class="muted">
              ${pcEscapar(erro.message || 'Erro desconhecido')}
            </p>
          </div>
        `;
      }
    }

  });

}



function filterClients() {

  const input = document.getElementById('clientSearch');
  const lista = document.getElementById('clientsList');

  if (!input || !lista) return;

  const busca = input.value
    .trim()
    .toLocaleLowerCase('pt-BR');

  const clientes = (window.currentClients || [])
    .filter(cliente => {

      const nome = String(cliente.nome || '')
        .toLocaleLowerCase('pt-BR');

      const telefone = String(cliente.telefone || '')
        .toLocaleLowerCase('pt-BR');

      return nome.includes(busca) ||
             telefone.includes(busca);
    });

  lista.innerHTML = clientes.length
    ? clientes.map(cliente => {

        const id = String(cliente.id || '');

        const idValido =
          /^[0-9a-fA-F-]{36}$/.test(id);

        return `
          <div class="card">

            <div class="product-name">
              ${pcEscapar(cliente.nome || 'Sem nome')}
            </div>

            <div class="muted">
              ${pcEscapar(
                cliente.telefone || 'Sem telefone'
              )}
            </div>

            <div class="muted">
              ${pcEscapar(
                cliente.endereço || 'Sem endereço'
              )}
            </div>

            ${idValido ? `
              <div
                class="actions"
                style="
                  margin-top:14px;
                  display:flex;
                  gap:10px;
                  flex-wrap:wrap;
                "
              >
                <button
                  type="button"
                  class="secondary"
                  data-cliente-historico="${id}"
                >
                  📋 Histórico de compras
                </button>

                <button
                  type="button"
                  class="secondary"
                  data-cliente-editar-endereco="${id}"
                >
                  📍 Editar localização no mapa
                </button>
                
                <button
                  type="button"
                  class="secondary"
                  data-cliente-excluir="${id}"
                  style="
                    color:#b42318;
                    border:1px solid #f1b5b0;
                  "
                >
                  🗑️ Excluir cliente
                </button>
              </div>
            ` : ''}

          </div>
        `;
      }).join('')
    : `
      <div class="card">
        <strong>Nenhum cliente encontrado</strong>
        <p class="muted">
          Tente pesquisar outro nome ou telefone.
        </p>
      </div>
    `;

}


async function excluirCliente(clienteId) {

  const cliente = (window.currentClients || [])
    .find(c => String(c.id) === String(clienteId));

  if (!cliente) {
    alert('Cliente não encontrado.');
    return;
  }

  const confirmar = confirm(
    `Deseja realmente excluir o cliente "${cliente.nome}"?\n\n` +
    'Essa ação não poderá ser desfeita.'
  );

  if (!confirmar) return;

  try {

    // Verificar se o cliente possui vendas
    const { data: vendas, error: erroVendas } =
      await supabaseClient
        .from('vendas')
        .select('id')
        .eq('cliente_id', clienteId)
        .limit(1);

    if (erroVendas) throw erroVendas;

    if (vendas && vendas.length) {
      alert(
        'Este cliente possui vendas registradas e não pode ser excluído.'
      );
      return;
    }

    // Verificar se possui contas a receber
    const { data: contas, error: erroContas } =
      await supabaseClient
        .from('contas_receber')
        .select('id')
        .eq('cliente_id', clienteId)
        .limit(1);

    if (erroContas) throw erroContas;

    if (contas && contas.length) {
      alert(
        'Este cliente possui contas a receber e não pode ser excluído.'
      );
      return;
    }

    // Excluir cliente
    const { data: excluido, error: erroExcluir } =
      await supabaseClient
        .from('clientes')
        .delete()
        .eq('id', clienteId)
        .select('id');

    if (erroExcluir) throw erroExcluir;

    if (!excluido || !excluido.length) {
      alert(
        'Não foi possível confirmar a exclusão. Verifique suas permissões.'
      );
      return;
    }

    window.currentClients =
      (window.currentClients || []).filter(
        c => String(c.id) !== String(clienteId)
      );

    const painel = document.getElementById(
      'pcHistoricoCliente'
    );

    if (painel) painel.innerHTML = '';

    filterClients();

    alert('Cliente excluído com sucesso!');

  } catch (erro) {

    console.error('Erro ao excluir cliente:', erro);

    alert(
      'Não foi possível excluir o cliente.\n\n' +
      (erro.message || 'Erro desconhecido.')
    );
  }
}

async function saveClient() {

  const nome = document.getElementById('clientName')?.value.trim();
  const telefone = document.getElementById('clientPhone')?.value.trim();
  const endereco = document.getElementById('clientAddress')?.value.trim();

  // Preserva a localização marcada no mapa.
  const latitude = window.clienteLatitude ?? null;
  const longitude = window.clienteLongitude ?? null;

  if (!nome) {
    alert('Informe o nome do cliente.');
    return;
  }

  // Normaliza o telefone para comparação.
  const telefoneNumeros = (telefone || '').replace(/\D/g, '');

  if (telefone && telefoneNumeros.length < 10) {
    alert('Informe um telefone válido com DDD.');
    return;
  }

  // Verifica clientes existentes antes de cadastrar.
  if (telefoneNumeros) {

    const { data: clientesExistentes, error: erroConsulta } =
      await supabaseClient
        .from('clientes')
        .select('id,nome,telefone,endereço');

    if (erroConsulta) {
      console.error('Erro ao verificar clientes:', erroConsulta);

      alert(
        'Não foi possível verificar se o cliente já existe.\n' +
        'O cadastro não foi realizado. Tente novamente.'
      );
      return;
    }

    const clienteDuplicado = (clientesExistentes || []).find(cliente => {
      const numeroExistente = String(cliente.telefone || '')
        .replace(/\D/g, '');

      return numeroExistente === telefoneNumeros;
    });

    if (clienteDuplicado) {
      alert(
        '⚠️ Este telefone já está cadastrado!\n\n' +
        'Cliente: ' + clienteDuplicado.nome + '\n' +
        'Telefone: ' + clienteDuplicado.telefone + '\n' +
        'Endereço: ' + (clienteDuplicado.endereço || 'Não informado') +
        '\n\nUtilize o cadastro existente para manter ' +
        'o histórico de compras e pagamentos no mesmo cliente.'
      );

      return;
    }
  }

  // Cadastra somente quando não foi encontrada duplicidade.
  const { error } = await supabaseClient
    .from('clientes')
    .insert({
      nome: nome,
      telefone: telefoneNumeros || null,
      endereço: endereco || null,
      latitude: latitude,
      longitude: longitude
    });

  if (error) {

    console.error('ERRO AO CADASTRAR CLIENTE:', error);

    alert(
      'Não foi possível cadastrar o cliente:\n\n' +
      error.message
    );

    return;
  }

  // Limpa a localização somente após salvar.
  window.clienteLatitude = null;
  window.clienteLongitude = null;

  alert('Cliente cadastrado com sucesso!');

  await renderClients(
    document.getElementById('content')
  );
}
async function abrirConfirmacaoCancelamento(vendaId, formaPagamento) {

  if (state.user?.tipo !== 'admin') {
    alert('Somente administradores podem cancelar vendas.');
    return;
  }
const { data: entregas, error: erroEntregas } =
  await supabaseClient
    .from('entregas')
    .select('id')
    .eq('venda_id', vendaId)
    .limit(1);

if (erroEntregas) {
  console.error('Erro ao verificar entregas:', erroEntregas);
  alert('Não foi possível verificar as entregas desta venda. Tente novamente.');
  return;
}

if (entregas && entregas.length > 0) {
  alert(
    `A venda #${vendaId} possui uma entrega vinculada e não pode ser cancelada.`
  );
  return;
}
  const pagamento = String(formaPagamento || '')
    .trim()
    .toLowerCase();

  const exigeEstorno = [
    'dinheiro',
    'pix',
    'cartão',
    'cartao'
  ].includes(pagamento);

  const janelaExistente =
    document.getElementById('janelaCancelamentoVenda');

  if (janelaExistente) {
    janelaExistente.remove();
  }

const fundo = document.createElement('div');
fundo.id = 'janelaCancelamentoVenda';

// Guardar o número da venda selecionada
const idVenda = Number(vendaId);

if (!Number.isSafeInteger(idVenda) || idVenda <= 0) {
  alert('Identificador da venda inválido.');
  return;
}

fundo.dataset.vendaId = String(idVenda);
  fundo.style.cssText = `
    position:fixed;
    inset:0;
    background:rgba(0,0,0,0.65);
    z-index:99999;
    display:flex;
    align-items:center;
    justify-content:center;
    padding:16px;
    box-sizing:border-box;
  `;

  fundo.innerHTML = `
    <div style="
      background:#fff;
      color:#222;
      width:100%;
      max-width:440px;
      padding:24px;
      border-radius:16px;
      box-sizing:border-box;
    ">

      <h2 style="margin-top:0;">
        Cancelar venda #${vendaId}
      </h2>

      <p style="color:#666;">
        Esta operação poderá devolver produtos ao estoque
        e registrar movimentações financeiras.
      </p>

      <p>
        <strong>Forma de pagamento:</strong>
        ${pagamento}
      </p>

      <label for="motivoCancelamentoVenda">
        <strong>Motivo do cancelamento</strong>
      </label>

      <textarea
        id="motivoCancelamentoVenda"
        placeholder="Informe o motivo..."
        style="
          width:100%;
          min-height:90px;
          margin-top:8px;
          padding:10px;
          box-sizing:border-box;
          border:1px solid #ccc;
          border-radius:8px;
        "
      ></textarea>

      ${exigeEstorno ? `
        <div style="margin-top:16px;">
          <label>
            <input
              type="checkbox"
              id="estornoCancelamentoVenda"
            >
            Confirmo que o valor já foi devolvido ao cliente.
          </label>
        </div>
      ` : ''}

      <div style="
        display:flex;
        justify-content:flex-end;
        gap:10px;
        margin-top:24px;
      ">

        <button
          class="btn secondary"
          onclick="document.getElementById('janelaCancelamentoVenda').remove()"
        >
          Voltar
        </button>

        <button
          class="btn primary"
          onclick="validarCancelamentoVenda()"
        >
          Confirmar cancelamento
        </button>

      </div>
    </div>
  `;

  document.body.appendChild(fundo);
}
let cancelamentoVendaEmProcessamento = false;

async function validarCancelamentoVenda() {

  if (cancelamentoVendaEmProcessamento) {
    return;
  }

  if (state.user?.tipo !== 'admin') {
    alert('Somente administradores podem cancelar vendas.');
    return;
  }

  const janela = document.getElementById(
    'janelaCancelamentoVenda'
  );

  if (!janela) {
    alert('Janela de cancelamento não encontrada.');
    return;
  }

  // Identificar a venda selecionada
  const vendaId = Number(janela.dataset.vendaId);

  if (!Number.isSafeInteger(vendaId) || vendaId <= 0) {
    alert('Não foi possível identificar a venda.');
    return;
  }

  const motivo = document.getElementById(
    'motivoCancelamentoVenda'
  )?.value.trim();

  if (!motivo || motivo.length < 5) {
    alert('Informe um motivo com pelo menos 5 caracteres.');
    return;
  }

  const campoEstorno = document.getElementById(
    'estornoCancelamentoVenda'
  );

  if (campoEstorno && !campoEstorno.checked) {
    alert(
      'Antes de continuar, confirme que o valor já foi devolvido ao cliente.'
    );
    return;
  }

  // Confirmação final da operação REAL
  const confirmou = confirm(
    'ATENÇÃO: CANCELAMENTO DEFINITIVO!\n\n' +
    'Venda: #' + vendaId + '\n\n' +
    'Motivo: ' + motivo + '\n\n' +
    'Esta operação poderá:\n' +
    '- Devolver produtos ao estoque;\n' +
    '- Cancelar valores a receber;\n' +
    '- Registrar o estorno no caixa.\n\n' +
    'O histórico da venda será preservado.\n\n' +
    'Deseja realmente cancelar esta venda?'
  );

  if (!confirmou) {
    return;
  }

  const botao = janela.querySelector(
    'button[onclick="validarCancelamentoVenda()"]'
  );

  cancelamentoVendaEmProcessamento = true;

  if (botao) {
    botao.disabled = true;
    botao.textContent = 'Cancelando venda...';
  }

  try {

    const { data, error } =
      await supabaseClient.functions.invoke(
        'cancelar-venda',
        {
          body: {
            venda_id: vendaId,
            motivo: motivo,
            estorno_confirmado:
              campoEstorno?.checked === true
          }
        }
      );

    if (error) {

      let mensagem = error.message;

      try {
        const resposta = await error.context.json();
        mensagem = resposta?.mensagem || mensagem;
      } catch (_) {
        // Mantém a mensagem original.
      }

      console.error(
        'Erro ao cancelar venda:',
        mensagem
      );

      alert(
        'Não foi possível confirmar o cancelamento.\n\n' +
        mensagem +
        '\n\nConsulte o relatório antes de tentar novamente.'
      );

      // Atualizar o relatório mesmo em caso de erro,
      // pois pode ter ocorrido uma falha de comunicação
      // após o servidor processar a operação.
      await carregarRelatorio();

      return;
    }

    console.log(
      'Cancelamento confirmado pelo servidor:',
      data
    );

    // Fechar a janela de cancelamento
    janela.remove();

    // Atualizar as vendas e os totais
    await carregarRelatorio();

    alert(
      'Venda #' + vendaId +
      ' cancelada com sucesso!\n\n' +
      'O histórico foi preservado e o relatório atualizado.'
    );

  } catch (erro) {

    console.error(
      'Falha na solicitação de cancelamento:',
      erro
    );

    alert(
      'Não foi possível confirmar o resultado da operação.\n\n' +
      'Verifique o relatório antes de tentar novamente.'
    );

    try {
      await carregarRelatorio();
    } catch (erroAtualizacao) {
      console.error(
        'Erro ao atualizar relatório:',
        erroAtualizacao
      );
    }

  } finally {

    cancelamentoVendaEmProcessamento = false;

    if (botao && botao.isConnected) {
      botao.disabled = false;
      botao.textContent = 'Confirmar cancelamento';
    }

  }
}
// =====================================
// OBSERVAÇÕES — PONTO DA CONSTRUÇÃO
// =====================================

async function renderObservations(el) {

  el.innerHTML = `
    <div class="card">

      <h2>📝 Nova observação</h2>

      <p class="muted">
        Registre recados, lembretes e informações
        importantes da loja.
      </p>

      <div class="field">
        <label for="obsData">Data e hora</label>
        <input
          id="obsData"
          type="datetime-local"
        >
      </div>

      <div class="field">
        <label for="obsDescricao">Observação</label>
        <textarea
          id="obsDescricao"
          rows="5"
          maxlength="5000"
          placeholder="Escreva sua observação aqui..."
          style="width:100%;box-sizing:border-box"
        ></textarea>
      </div>

      <button
        id="obsSalvar"
        class="primary"
        onclick="salvarObservacao()"
      >
        💾 Salvar observação
      </button>

    </div>

    <div class="section-title">
      <h2>📋 Histórico de observações</h2>
    </div>

    <div id="obsLista" class="card">
      Carregando observações...
    </div>
  `;

  // Preencher com a data e hora locais
  const agora = new Date();
  const local = new Date(
    agora.getTime() - agora.getTimezoneOffset() * 60000
  );

  document.getElementById('obsData').value =
    local.toISOString().slice(0, 16);

  await carregarObservacoes();
}


// =====================================
// SALVAR OBSERVAÇÃO
// =====================================

async function salvarObservacao() {

  const descricao =
    document.getElementById('obsDescricao')?.value.trim();

  const dataInformada =
    document.getElementById('obsData')?.value;

  if (!descricao) {
    alert('Escreva uma observação antes de salvar.');
    return;
  }

  if (!dataInformada) {
    alert('Informe a data e a hora.');
    return;
  }

  const data = new Date(dataInformada);

  if (Number.isNaN(data.getTime())) {
    alert('Informe uma data válida.');
    return;
  }

  const botao = document.getElementById('obsSalvar');

  if (botao) {
    botao.disabled = true;
    botao.textContent = 'Salvando...';
  }

  try {

    const { error } = await supabaseClient
      .from('observacoes')
      .insert({
        descricao,
        data_observacao: data.toISOString(),
        criado_por: state.user.id
      });

    if (error) throw error;

    alert('Observação salva com sucesso!');

    navigate('observations');

  } catch (erro) {

    console.error('Erro ao salvar observação:', erro);
    alert('Não foi possível salvar: ' + erro.message);

  } finally {

    if (botao && botao.isConnected) {
      botao.disabled = false;
      botao.textContent = '💾 Salvar observação';
    }

  }
}


// =====================================
// CARREGAR HISTÓRICO
// =====================================

async function carregarObservacoes() {

  const lista = document.getElementById('obsLista');

  if (!lista) return;

  const { data, error } = await supabaseClient
    .from('observacoes')
    .select('id,descricao,data_observacao')
    .order('data_observacao', { ascending: false })
    .order('id', { ascending: false });

  if (!lista.isConnected) return;

  if (error) {
    lista.textContent =
      'Erro ao carregar observações: ' + error.message;
    return;
  }

  if (!data?.length) {
    lista.innerHTML = `
      <p class="muted">
        Nenhuma observação registrada ainda.
      </p>
    `;
    return;
  }

  lista.innerHTML = data.map(obs => {

    const dataFormatada = new Date(
      obs.data_observacao
    ).toLocaleString('pt-BR');

    return `
      <div style="
        padding:14px 0;
        border-bottom:1px solid #e2e8f0;
      ">

        <strong>📅 ${pcEscapar(dataFormatada)}</strong>

        <p style="
          white-space:pre-wrap;
          overflow-wrap:anywhere;
          margin:10px 0;
        ">${pcEscapar(obs.descricao)}</p>

        <div class="actions">

          <button
            class="secondary"
            onclick="editarObservacao(${Number(obs.id)})"
          >
            ✏️ Editar
          </button>

          <button
            class="danger"
            onclick="excluirObservacao(${Number(obs.id)})"
          >
            🗑️ Excluir
          </button>

        </div>

      </div>
    `;

  }).join('');
}


// =====================================
// EDITAR OBSERVAÇÃO
// =====================================

async function editarObservacao(id) {

  const { data, error } = await supabaseClient
    .from('observacoes')
    .select('descricao')
    .eq('id', id)
    .single();

  if (error) {
    alert('Não foi possível abrir a observação.');
    return;
  }

  const novoTexto = prompt(
    'Editar observação:',
    data.descricao
  );

  if (novoTexto === null) return;

  if (!novoTexto.trim()) {
    alert('A observação não pode ficar vazia.');
    return;
  }

  const { error: erroSalvar } = await supabaseClient
    .from('observacoes')
    .update({
      descricao: novoTexto.trim()
    })
    .eq('id', id);

  if (erroSalvar) {
    alert('Erro ao editar: ' + erroSalvar.message);
    return;
  }

  await carregarObservacoes();
}


// =====================================
// EXCLUIR OBSERVAÇÃO
// =====================================

async function excluirObservacao(id) {

  if (!confirm('Deseja realmente excluir esta observação?')) {
    return;
  }

  const { error } = await supabaseClient
    .from('observacoes')
    .delete()
    .eq('id', id);

  if (error) {
    alert('Erro ao excluir: ' + error.message);
    return;
  }

  await carregarObservacoes();
}
// =====================================
// EDITAR ENDEREÇO DO CLIENTE
// =====================================

// =====================================
// EDITAR LOCALIZAÇÃO DO CLIENTE NO MAPA
// =====================================

async function editarEnderecoCliente(cliente) {

  if (!cliente || !cliente.id) {
    alert('Cliente não encontrado.');
    return;
  }

  if (typeof L === 'undefined') {
    alert('Não foi possível carregar o mapa.');
    return;
  }

  const content = document.getElementById('content');

  if (!content) return;

  const latitudeAtual = Number(cliente.latitude);
  const longitudeAtual = Number(cliente.longitude);

  const possuiLocalizacao =
    cliente.latitude != null &&
    cliente.longitude != null &&
    Number.isFinite(latitudeAtual) &&
    Number.isFinite(longitudeAtual) &&
    Math.abs(latitudeAtual) <= 90 &&
    Math.abs(longitudeAtual) <= 180;

  let latitudeSelecionada = possuiLocalizacao
    ? latitudeAtual
    : null;

  let longitudeSelecionada = possuiLocalizacao
    ? longitudeAtual
    : null;

  content.innerHTML = `
    <div class="card">

      <h2>📍 Editar localização</h2>

      <p>
        <strong>${pcEscapar(cliente.nome || 'Cliente')}</strong>
      </p>

      <p class="muted">
        ${pcEscapar(cliente['endereço'] || 'Sem endereço informado')}
      </p>

      <p class="muted">
        Toque no mapa para escolher a localização correta.
      </p>

      <div
        id="mapaEdicaoCliente"
        style="
          width:100%;
          height:400px;
          border-radius:12px;
          overflow:hidden;
          margin:15px 0;
        "
      ></div>

      <p id="statusEdicaoLocalizacao" class="muted">
        ${
          possuiLocalizacao
            ? '📍 Localização atual do cliente.'
            : 'Nenhuma localização cadastrada. Marque um ponto no mapa.'
        }
      </p>

      <div
        class="actions"
        style="
          display:flex;
          gap:10px;
          flex-wrap:wrap;
          margin-top:16px;
        "
      >

        <button
          type="button"
          class="secondary"
          id="cancelarEdicaoLocalizacao"
        >
          Cancelar
        </button>

        <button
          type="button"
          class="primary"
          id="salvarEdicaoLocalizacao"
        >
          💾 Salvar localização
        </button>

      </div>

    </div>
  `;

  const mapa = L.map('mapaEdicaoCliente').setView(
    possuiLocalizacao
      ? [latitudeAtual, longitudeAtual]
      : [-0.858, -48.141],
    possuiLocalizacao ? 17 : 15
  );

  L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }
  ).addTo(mapa);

  let marcador = null;

  if (possuiLocalizacao) {
    marcador = L.marker([
      latitudeAtual,
      longitudeAtual
    ]).addTo(mapa);
  }

  const status = document.getElementById(
    'statusEdicaoLocalizacao'
  );

  mapa.on('click', function(evento) {

    latitudeSelecionada = evento.latlng.lat;
    longitudeSelecionada = evento.latlng.lng;

    if (marcador) {
      marcador.setLatLng(evento.latlng);
    } else {
      marcador = L.marker(evento.latlng).addTo(mapa);
    }

    status.textContent =
      '✅ Nova localização marcada. Clique em Salvar localização.';

  });

  setTimeout(() => {
    if (mapa.getContainer().isConnected) {
      mapa.invalidateSize();
    }
  }, 200);

  function voltarParaClientes() {
    mapa.remove();
    navigate('clients');
  }

  document.getElementById(
    'cancelarEdicaoLocalizacao'
  ).addEventListener('click', voltarParaClientes);

  document.getElementById(
    'salvarEdicaoLocalizacao'
  ).addEventListener('click', async function() {

    if (
      latitudeSelecionada === null ||
      longitudeSelecionada === null
    ) {
      alert('Marque uma localização no mapa antes de salvar.');
      return;
    }

    const botao = this;

    botao.disabled = true;
    botao.textContent = 'Salvando...';

    try {

      const { data, error } = await supabaseClient
        .from('clientes')
        .update({
          latitude: latitudeSelecionada,
          longitude: longitudeSelecionada
        })
        .eq('id', cliente.id)
        .select('id,latitude,longitude')
        .single();

      if (error) throw error;

      cliente.latitude = data.latitude;
      cliente.longitude = data.longitude;

      alert('✅ Localização atualizada com sucesso!');

      voltarParaClientes();

    } catch (erro) {

      console.error(
        'Erro ao atualizar localização:',
        erro
      );

      alert(
        'Não foi possível salvar a localização: ' +
        (erro.message || 'Erro desconhecido.')
      );

      botao.disabled = false;
      botao.textContent = '💾 Salvar localização';

    }

  });

}

// =====================================
// PADRONIZAR CAMPOS EM LETRAS MAIÚSCULAS
// =====================================

document.addEventListener('input', function(evento) {

  const campo = evento.target;

  if (!(campo instanceof HTMLInputElement) &&
      !(campo instanceof HTMLTextAreaElement)) {
    return;
  }

  if (campo instanceof HTMLInputElement) {
    const tipo = campo.type.toLowerCase();

    if (!['text', 'search'].includes(tipo)) {
      return;
    }
  }

  if (
    campo.matches(
      '[type="email"], [type="password"], [type="tel"]'
    )
  ) {
    return;
  }

  const inicio = campo.selectionStart;
  const fim = campo.selectionEnd;

  const textoMaiusculo =
    campo.value.toLocaleUpperCase('pt-BR');

  if (campo.value === textoMaiusculo) {
    return;
  }

  campo.value = textoMaiusculo;

  if (inicio !== null && fim !== null) {
    campo.setSelectionRange(inicio, fim);
  }

}, true);
if (document.readyState === 'loading') {

  document.addEventListener(
    'DOMContentLoaded',
    restaurarSessao,
    { once: true }
  );

} else {

  restaurarSessao();

}




async function renderSettings(el) {

  if (!el) return;

  const ehAdministrador =
    state.user?.tipo === 'admin';

  const escapar = valor =>
    String(valor ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c]));

  if (!ehAdministrador) {
    el.innerHTML = `
      <div class="card">
        <h2>Acesso restrito</h2>
        <p class="muted">
          Somente administradores podem
          gerenciar usuários.
        </p>
      </div>
    `;
    return;
  }

  el.innerHTML = `
    <div class="section-title">
      <h2>⚙️ Configurações</h2>
    </div>

    <div class="card">
      <h2>👥 Gerenciar usuários</h2>

      <p class="muted">
        Consulte os funcionários e gerencie
        seus acessos ao sistema.
      </p>

      <button
        type="button"
        class="primary"
        id="settingsNovoFuncionario"
        style="margin:12px 0"
      >
        + Novo funcionário
      </button>

      <div
        id="settingsFormularioFuncionario"
        style="display:none"
      >
        <form
          id="settingsFormConvite"
          style="
            border:1px solid #e2e8f0;
            border-radius:12px;
            padding:16px;
            margin:12px 0 20px;
          "
        >
          <h3>Convidar entregador</h3>

          <p class="muted">
            O funcionário receberá um convite
            no e-mail informado.
          </p>

          <label for="settingsFuncionarioNome">
            Nome completo
          </label>
          <input
            id="settingsFuncionarioNome"
            type="text"
            maxlength="150"
            autocomplete="name"
            required
            style="width:100%;margin:6px 0 12px"
          >

          <label for="settingsFuncionarioEmail">
            E-mail
          </label>
          <input
            id="settingsFuncionarioEmail"
            type="email"
            maxlength="254"
            autocomplete="email"
            required
            style="width:100%;margin:6px 0 12px"
          >

          <label for="settingsFuncionarioTelefone">
            Telefone (opcional)
          </label>
          <input
            id="settingsFuncionarioTelefone"
            type="tel"
            maxlength="30"
            autocomplete="tel"
            style="width:100%;margin:6px 0 12px"
          >

          <p>
            <strong>Perfil:</strong> Entregador
          </p>

          <div
            style="
              display:flex;
              gap:10px;
              flex-wrap:wrap;
              margin-top:14px;
            "
          >
            <button
              type="submit"
              class="primary"
              id="settingsEnviarConvite"
            >
              Enviar convite
            </button>

            <button
              type="button"
              id="settingsCancelarConvite"
            >
              Cancelar
            </button>
          </div>

          <p
            id="settingsMensagemConvite"
            class="muted"
            role="status"
            style="margin-top:12px"
          ></p>
        </form>
      </div>

      <div id="settingsUsers">
        Carregando usuários...
      </div>
    </div>
  `;

  const lista = el.querySelector('#settingsUsers');

  const botaoNovo =
    el.querySelector('#settingsNovoFuncionario');

  const areaFormulario =
    el.querySelector('#settingsFormularioFuncionario');

  const formulario =
    el.querySelector('#settingsFormConvite');

  const botaoCancelar =
    el.querySelector('#settingsCancelarConvite');

  const botaoEnviar =
    el.querySelector('#settingsEnviarConvite');

  const mensagem =
    el.querySelector('#settingsMensagemConvite');

  botaoNovo.addEventListener('click', () => {
    areaFormulario.style.display = 'block';
    botaoNovo.style.display = 'none';
    mensagem.textContent = '';

    el.querySelector('#settingsFuncionarioNome')
      .focus();
  });

  botaoCancelar.addEventListener('click', () => {
    areaFormulario.style.display = 'none';
    botaoNovo.style.display = '';
    formulario.reset();
    mensagem.textContent = '';
  });

  formulario.addEventListener('submit', async evento => {

    evento.preventDefault();

    if (botaoEnviar.disabled) return;

    const nome =
      el.querySelector('#settingsFuncionarioNome')
        .value.trim();

    const email =
      el.querySelector('#settingsFuncionarioEmail')
        .value.trim().toLowerCase();

    const telefone =
      el.querySelector('#settingsFuncionarioTelefone')
        .value.trim();

    if (nome.length < 3) {
      mensagem.textContent =
        'Informe um nome com pelo menos 3 caracteres.';
      return;
    }

    if (!email) {
      mensagem.textContent =
        'Informe um e-mail válido.';
      return;
    }

    const confirmou = window.confirm(
      `Deseja enviar um convite de acesso para ${nome} (${email})?`
    );

    if (!confirmou) return;

    botaoEnviar.disabled = true;
    botaoCancelar.disabled = true;
    botaoEnviar.textContent = 'Enviando...';

    mensagem.textContent =
      'Solicitando cadastro e envio do convite...';

    try {

      const { data: sessao, error: erroSessao } =
        await supabaseClient.auth.getSession();

      if (erroSessao) throw erroSessao;

      const accessToken =
        sessao?.session?.access_token;

      if (!accessToken) {
        throw new Error(
          'Sua sessão expirou. Entre novamente no sistema.'
        );
      }

      const { data, error } =
        await supabaseClient.functions.invoke(
          'cadastrar-funcionario',
          {
            body: {
              nome,
              email,
              telefone,
              tipo: 'entregador'
            },
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          }
        );

      if (error) {
        let detalhe = '';

        if (error.context &&
            typeof error.context.json === 'function') {
          try {
            const respostaErro =
              await error.context.json();

            detalhe =
              respostaErro?.error ||
              respostaErro?.message ||
              '';
          } catch (_) {
            // Mantém a mensagem original.
          }
        }

        throw new Error(
          detalhe ||
          error.message ||
          'Não foi possível enviar o convite.'
        );
      }

      if (!data?.success) {
        throw new Error(
          data?.error ||
          'O servidor não confirmou o cadastro.'
        );
      }

      alert(
        data.message ||
        'Convite solicitado com sucesso.'
      );

      if (state.page === 'settings') {
        await renderSettings(el);
      }

    } catch (erro) {

      console.error(
        'Erro ao cadastrar funcionário:',
        erro
      );

      mensagem.textContent =
        'Não foi possível concluir: ' +
        (erro.message || 'Erro desconhecido.');

      botaoEnviar.disabled = false;
      botaoCancelar.disabled = false;
      botaoEnviar.textContent = 'Enviar convite';
    }

  });

  try {

    const { data, error } = await supabaseClient
      .from('usuarios')
      .select('id,nome,email,telefone,tipo,ativo')
      .order('nome', { ascending: true });

    if (error) throw error;

    if (!lista?.isConnected || state.page !== 'settings') {
      return;
    }

    const usuarios = data || [];
    const meuId = String(state.user?.id || '');

    if (!usuarios.length) {
      lista.textContent = 'Nenhum usuário encontrado.';
      return;
    }

    lista.innerHTML = usuarios.map(usuario => {

      const perfil =
        ['admin', 'administrador'].includes(usuario.tipo)
          ? 'Administrador'
          : usuario.tipo === 'entregador'
            ? 'Entregador'
            : 'Funcionário';

      const propriaConta =
        String(usuario.id) === meuId;

      const acao = usuario.ativo
        ? 'Desativar'
        : 'Ativar';

      return `
        <div
          style="
            border:1px solid #e2e8f0;
            border-radius:12px;
            padding:14px;
            margin-top:12px;
          "
        >
          <strong>${escapar(usuario.nome)}</strong>

          ${propriaConta ? `
            <span class="muted">(Você)</span>
          ` : ''}

          <p class="muted">
            ${escapar(usuario.email)}
          </p>

          <p>
            <strong>Telefone:</strong>
            ${escapar(usuario.telefone || 'Não informado')}
          </p>

          <p>
            <strong>Perfil:</strong>
            ${perfil}
          </p>

          <p>
            <strong>Situação:</strong>
            <span style="
              color:${usuario.ativo ? '#166534' : '#b91c1c'};
              font-weight:bold;
            ">
              ${usuario.ativo ? 'Ativo' : 'Inativo'}
            </span>
          </p>

          ${!propriaConta ? `
            <button
              type="button"
              class="${usuario.ativo ? 'danger' : 'primary'}"
              data-alterar-usuario="${escapar(usuario.id)}"
              style="margin-top:10px"
            >
              ${acao} acesso
            </button>
          ` : `
            <p class="muted" style="font-size:12px">
              Sua própria conta não pode ser
              ativada ou desativada por aqui.
            </p>
          `}
        </div>
      `;
    }).join('');

    lista.querySelectorAll('[data-alterar-usuario]')
      .forEach(botao => {

        botao.addEventListener('click', async () => {

          if (botao.disabled) return;

          const id = botao.dataset.alterarUsuario;

          const usuario = usuarios.find(
            u => String(u.id) === String(id)
          );

          if (!usuario) return;

          const novoStatus = !usuario.ativo;

          const acao = novoStatus
            ? 'ativar'
            : 'desativar';

          const confirmou = window.confirm(
            `Deseja realmente ${acao} o acesso de ` +
            `${usuario.nome}?`
          );

          if (!confirmou) return;

          botao.disabled = true;
          botao.textContent = 'Aguarde...';

          try {

            const { error: erroAlteracao } =
              await supabaseClient.rpc(
                'alterar_status_usuario_admin',
                {
                  p_usuario_id: usuario.id,
                  p_ativo: novoStatus
                }
              );

            if (erroAlteracao) {
              throw erroAlteracao;
            }

            alert(
              `Acesso de ${usuario.nome} ` +
              `${novoStatus ? 'ativado' : 'desativado'} com sucesso.`
            );

            if (state.page === 'settings') {
              await renderSettings(el);
            }

          } catch (erro) {

            console.error(
              'Erro ao alterar acesso do usuário:',
              erro
            );

            alert(
              'Não foi possível alterar o acesso: ' +
              (erro.message || 'Erro desconhecido.')
            );

            botao.disabled = false;

            botao.textContent = novoStatus
              ? 'Ativar acesso'
              : 'Desativar acesso';
          }

        });

      });

  } catch (erro) {

    console.error('Erro ao carregar usuários:', erro);

    if (lista?.isConnected && state.page === 'settings') {
      lista.textContent =
        'Não foi possível carregar os usuários: ' +
        (erro.message || 'Erro desconhecido.');
    }

  }
}
