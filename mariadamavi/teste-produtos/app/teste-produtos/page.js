'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Alert, Autocomplete, Avatar, Box, Button, Chip, CircularProgress, CssBaseline,
  InputAdornment, Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TablePagination, TableRow, TableSortLabel, TextField, Typography,
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import {
  Android, Apple, CategoryOutlined, EventOutlined, Inventory2Outlined,
  LaptopMacOutlined, LocalOfferOutlined, PhoneAndroidOutlined, Search, StorefrontOutlined,
  WatchOutlined,
} from '@mui/icons-material';
import {
  cheapestByColor, colorSwatch, filterFields, filterListings, filterOptions, matchProducts, normalize,
  prepareListing, productOptions, sortByPrice,
} from './listings.js';
import './products.css';

const theme = createTheme({
  palette: {
    background: { default: '#f7f8f7', paper: '#fff' },
    primary: { main: '#121613' },
    success: { main: '#087c46' },
    text: { primary: '#151916', secondary: '#5c655e' },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: 'Arial, Helvetica, sans-serif',
    button: { textTransform: 'none', fontWeight: 650 },
  },
});

const segments = [
  ['apple', 'Apple', Apple],
  ['android', 'Android', Android],
  ['used', 'Seminovo', PhoneAndroidOutlined],
  ['other', 'Outros produtos', CategoryOutlined],
];

const formatPrice = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const formatNumber = new Intl.NumberFormat('pt-BR');
const formatTime = new Intl.DateTimeFormat('pt-BR', {
  timeStyle: 'medium', timeZone: 'America/Sao_Paulo',
});

function ColorDot({ color }) {
  return <span className="catalog-color-dot" aria-hidden="true" style={{ background: colorSwatch(color) }} />;
}

function Supplier({ row }) {
  const initials = row.supplier.match(/\p{L}+/gu)?.slice(0, 2).map(word => word[0]).join('').toUpperCase();
  const location = [...new Set([row.location, row.city].filter(Boolean))].join(' · ');
  return (
    <div className="catalog-supplier">
      <Avatar className="catalog-supplier-avatar" src={row.supplierPhoto} alt="" aria-hidden="true"
        slotProps={{ img: { loading: 'lazy', decoding: 'async', referrerPolicy: 'no-referrer' } }}>
        {initials || <StorefrontOutlined fontSize="inherit" />}
      </Avatar>
      <div>
        <strong>{row.supplier || 'Fornecedor não informado'}</strong>
        {location && <small className="catalog-detail">{location}</small>}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, tone }) {
  return (
    <Paper className="catalog-stat" variant="outlined">
      <span className={`catalog-stat-icon ${tone}`}><Icon fontSize="small" /></span>
      <div><small>{label}</small><strong>{value === null ? '—' : formatNumber.format(value)}</strong></div>
    </Paper>
  );
}

function CatalogTable({ rows, sort, onSort }) {
  return (
    <TableContainer>
      <Table size="small" className="catalog-table">
        <TableHead>
          <TableRow>
            <TableCell>Produto</TableCell>
            <TableCell>Fornecedor</TableCell>
            <TableCell>Capacidade</TableCell>
            <TableCell>Cor</TableCell>
            <TableCell>Categoria</TableCell>
            <TableCell>Região e RAM</TableCell>
            <TableCell align="right" sortDirection={onSort ? sort : false}>
              {onSort ? <TableSortLabel active direction={sort} onClick={onSort}>Preço no atacado</TableSortLabel> : 'Preço no atacado'}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(row => {
            const ProductIcon = row.category === 'MacBook' ? LaptopMacOutlined
              : row.category === 'Apple Watch' ? WatchOutlined : PhoneAndroidOutlined;
            const listed = Date.parse(row.time);
            return (
              <TableRow key={row.id} hover>
                <TableCell component="th" scope="row">
                  <span className="catalog-product"><ProductIcon fontSize="small" />{row.name || '—'}</span>
                  {row.condition && <small className="catalog-detail">{row.condition}</small>}
                </TableCell>
                <TableCell>
                  <Supplier row={row} />
                </TableCell>
                <TableCell>{row.storage || '—'}</TableCell>
                <TableCell>
                  <span className="catalog-color">
                    {row.color && <ColorDot color={row.color} />}{row.color || '—'}
                  </span>
                </TableCell>
                <TableCell>{row.category || '—'}</TableCell>
                <TableCell>{[row.region, row.ram].filter(Boolean).join(' · ') || '—'}</TableCell>
                <TableCell align="right">
                  <strong className="catalog-price">{row.price === null ? '—' : formatPrice.format(row.price)}</strong>
                  {Number.isFinite(listed) && <small className="catalog-detail">{formatTime.format(listed)}</small>}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default function TesteProdutos() {
  const [date, setDate] = useState('2026-11-09');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [product, setProduct] = useState(null);
  const [productInput, setProductInput] = useState('');
  const [segment, setSegment] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);
  const [fields, setFields] = useState({});
  const [sort, setSort] = useState('asc');
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(25);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`/api/teste-produtos?date=${encodeURIComponent(date)}`, {
          cache: 'no-store', signal: controller.signal,
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Não foi possível consultar a lista.');
        if (!Array.isArray(result)) throw new Error('A API retornou um formato inesperado.');
        if (controller.signal.aborted) return;
        setListings(result.map(prepareListing));
      } catch (err) {
        if (!controller.signal.aborted) setError(err.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [date, attempt]);

  const segmentRows = useMemo(() => filterListings(listings, { segment }), [listings, segment]);
  const products = useMemo(() => productOptions(segmentRows), [segmentRows]);
  const productRows = useMemo(() =>
    product ? filterListings(segmentRows, { productKey: product.key }) : segmentRows,
  [segmentRows, product]);
  const options = useMemo(() => filterOptions(productRows), [productRows]);
  const categoryCount = useMemo(() => new Set(listings.map(row => row.category).filter(Boolean)).size, [listings]);
  const supplierCount = useMemo(() => new Set(listings.map(row => row.supplierId).filter(Boolean)).size, [listings]);
  const filtered = useMemo(() =>
    sortByPrice(filterListings(productRows, { activeOnly, fields }), sort),
  [productRows, activeOnly, fields, sort]);

  const hasFilters = Boolean(product || segment || activeOnly || Object.keys(fields).length);
  const choosingProduct = Boolean(productInput.trim() && productInput !== product?.label);
  const lowest = useMemo(() => product ? cheapestByColor(filtered) : [], [product, filtered]);
  const currentPage = Math.min(page, Math.max(0, Math.ceil(filtered.length / perPage) - 1));
  const visible = filtered.slice(currentPage * perPage, (currentPage + 1) * perPage);

  function updateFilter(update) {
    update();
    setPage(0);
  }

  function selectProduct(value) {
    setProduct(value);
    setProductInput(value?.label ?? '');
    setFields({});
  }

  function selectSegment(value) {
    const next = segment === value ? '' : value;
    setSegment(next);
    if (!product || !filterListings(listings, { segment: next, productKey: product.key }).length) {
      selectProduct(null);
    }
  }

  function loadDate(next) {
    setError('');
    setLoading(true);
    setListings([]);
    updateFilter(() => selectProduct(null));
    if (next === date) setAttempt(value => value + 1);
    else setDate(next);
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <header className="catalog-nav">
        <a className="catalog-brand" href="/teste-produtos"><img src="/icon.svg" width="29" height="29" alt="" /> Mavi<span>Catálogo</span></a>
        <Chip icon={<Inventory2Outlined />} label="Produtos" className="catalog-nav-active" />
        <span className="catalog-test-label"><i /> Ambiente de teste</span>
      </header>
      <main className="catalog-main">
        <Box className="catalog-overview">
          <div className="catalog-tools">
            <div className="catalog-stats">
              <Stat icon={Inventory2Outlined} label="Anúncios" value={loading || error ? null : listings.length} tone="neutral" />
              <Stat icon={StorefrontOutlined} label="Fornecedores" value={loading || error ? null : supplierCount} tone="green" />
              <Stat icon={CategoryOutlined} label="Categorias" value={loading || error ? null : categoryCount} tone="amber" />
            </div>
            <Paper className="catalog-search" variant="outlined">
              <Autocomplete
                id="catalog-product-search"
                options={products}
                value={product}
                inputValue={productInput}
                onInputChange={(_, value) => setProductInput(value)}
                onChange={(_, value) => updateFilter(() => selectProduct(value))}
                getOptionLabel={option => option.label}
                getOptionKey={option => option.key}
                isOptionEqualToValue={(option, value) => option.key === value.key}
                filterOptions={(values, { inputValue }) => matchProducts(values, inputValue)}
                autoHighlight
                loading={loading}
                loadingText="Consultando produtos…"
                noOptionsText="Nenhum modelo encontrado. Tente outro nome."
                clearText="Limpar modelo"
                slotProps={{ paper: { className: 'catalog-product-menu' } }}
                renderOption={({ key, ...props }, option) => (
                  <li key={key} {...props}>
                    <Search fontSize="small" aria-hidden="true" />
                    <span>{option.title}<small>{option.configuration || option.category}</small></span>
                  </li>
                )}
                renderInput={params => (
                  <TextField
                    {...params}
                    placeholder="Buscar modelo"
                    slotProps={{
                      ...params.slotProps,
                      htmlInput: { ...params.slotProps.htmlInput, 'aria-label': 'Buscar e selecionar produto' },
                      input: {
                        ...params.slotProps.input,
                        startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
                      },
                    }}
                  />
                )}
              />
              {!product && <p className="catalog-search-hint">Escolha uma sugestão para ver as ofertas e os filtros do modelo.</p>}
              <div className="catalog-segments" aria-label="Grupos de produtos">
                {segments.map(([value, label, Icon]) => (
                  <Chip
                    key={value}
                    label={label}
                    icon={<Icon />}
                    color={segment === value ? 'primary' : 'default'}
                    variant={segment === value ? 'filled' : 'outlined'}
                    aria-pressed={segment === value}
                    onClick={() => updateFilter(() => selectSegment(value))}
                  />
                ))}
              </div>
            </Paper>
          </div>
          <div className="catalog-banner">
            <div>
              <span className="catalog-banner-label"><i /> COTAÇÃO DE PRODUTOS</span>
              <Typography component="h1">Compare preços de fornecedores</Typography>
              <p>Veja quem tem o modelo na cor e na capacidade que você procura.</p>
            </div>
            <div className="catalog-banner-art" aria-hidden="true">
              <div><LocalOfferOutlined /><b>Melhor preço por cor</b><small>Os destaques acompanham seus filtros</small><span /></div>
            </div>
          </div>
        </Box>
        <Alert severity="warning" className="catalog-notice">Antes de comprar, confirme o preço e a disponibilidade com o fornecedor.</Alert>
        <Paper variant="outlined" className="catalog-filters" aria-label="Filtros do catálogo">
          <div className="catalog-filter-grid">
            <div className="catalog-filter">
              <label htmlFor="filter-date"><EventOutlined fontSize="inherit" /> Data</label>
              <TextField
                id="filter-date" fullWidth size="small" type="date" value={date}
                onChange={event => { if (event.target.value && event.target.value !== date) loadDate(event.target.value); }}
              />
            </div>
            {filterFields.map(([field, label, placeholder]) => (
              <div key={field} className="catalog-filter">
                <label htmlFor={`filter-${field}`}>{label}</label>
                <Autocomplete
                  id={`filter-${field}`}
                  size="small"
                  disabled={!options[field].length}
                  options={options[field]}
                  value={fields[field] ?? null}
                  onChange={(_, value) => updateFilter(() => setFields(current => {
                    const next = { ...current };
                    if (value) next[field] = value;
                    else delete next[field];
                    return next;
                  }))}
                  filterOptions={(values, { inputValue }) => values.filter(value => normalize(value).includes(normalize(inputValue)))}
                  noOptionsText="Nenhuma opção"
                  openText="Abrir opções"
                  closeText="Fechar opções"
                  clearText="Limpar filtro"
                  renderOption={field === 'color' ? ({ key, ...props }, color) => (
                    <li key={key} {...props}><span className="catalog-color"><ColorDot color={color} />{color}</span></li>
                  ) : undefined}
                  renderInput={params => (
                    <TextField {...params}
                      placeholder={options[field].length ? placeholder : 'Sem opções'}
                      slotProps={field === 'color' && fields.color ? {
                        ...params.slotProps,
                        input: {
                          ...params.slotProps.input,
                          startAdornment: <InputAdornment position="start"><ColorDot color={fields.color} /></InputAdornment>,
                        },
                      } : params.slotProps}
                    />
                  )}
                />
              </div>
            ))}
          </div>
          <div className="catalog-filter-actions">
            <Button variant={activeOnly ? 'contained' : 'outlined'} size="small" startIcon={<StorefrontOutlined />}
              aria-pressed={activeOnly} onClick={() => updateFilter(() => setActiveOnly(value => !value))}>
              Fornecedores ativos
            </Button>
            {hasFilters && (
              <Button size="small" onClick={() => updateFilter(() => {
                selectProduct(null); setSegment(''); setActiveOnly(false);
              })}>Limpar filtros</Button>
            )}
          </div>
        </Paper>
        {loading ? (
          <Paper variant="outlined" className="catalog-state" role="status"><CircularProgress size={22} /> Consultando anúncios do dia…</Paper>
        ) : error ? (
          <Alert severity="error" className="catalog-state" action={<Button color="inherit" onClick={() => loadDate(date)}>Tentar novamente</Button>}>{error}</Alert>
        ) : choosingProduct ? (
          <Paper variant="outlined" className="catalog-state" role="status">
            Escolha uma sugestão para ver os preços dessa configuração.
          </Paper>
        ) : (
          <>
            {lowest.length > 0 && (
              <section className="catalog-highlights" aria-labelledby="catalog-lowest">
                <Typography id="catalog-lowest" component="h2">
                  Menor preço por cor <span>({formatNumber.format(lowest.length)} {lowest.length === 1 ? 'cor' : 'cores'})</span>
                </Typography>
                <Paper variant="outlined" className="catalog-lowest-table">
                  <CatalogTable rows={lowest} />
                </Paper>
              </section>
            )}
            <Paper component="section" variant="outlined" className="catalog-results" aria-labelledby="catalog-results">
              <div className="catalog-results-title">
                <Typography id="catalog-results" component="h2">Todas as ofertas</Typography>
                <span role="status">{formatNumber.format(filtered.length)} anúncios</span>
              </div>
              {visible.length ? (
                <>
                  <CatalogTable rows={visible} sort={sort} onSort={() => updateFilter(() => setSort(value => value === 'asc' ? 'desc' : 'asc'))} />
                  <TablePagination
                    component="div" count={filtered.length} page={currentPage} rowsPerPage={perPage}
                    onPageChange={(_, next) => setPage(next)}
                    rowsPerPageOptions={[25, 50, 100]}
                    onRowsPerPageChange={event => updateFilter(() => setPerPage(Number(event.target.value)))}
                    labelRowsPerPage="Por página"
                    labelDisplayedRows={({ from, to, count }) => `${formatNumber.format(from)}–${formatNumber.format(to)} de ${formatNumber.format(count)}`}
                    getItemAriaLabel={type => type === 'next' ? 'Próxima página' : 'Página anterior'}
                  />
                </>
              ) : <p className="catalog-empty">{hasFilters ? 'Nenhuma oferta corresponde aos filtros selecionados.' : 'Não há ofertas para essa data. Selecione outro dia.'}</p>}
            </Paper>
          </>
        )}
      </main>
    </ThemeProvider>
  );
}
