import { useEffect, useMemo, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";

import {
  getCapturaSecciones,
  getPartidos,
  getResumen,
  getResultadosCasilla,
  getUsuarioActual,
  guardarResultadosCasilla,
  isAuthenticated,
  login,
  logout,
} from "./api";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const TIEMPO_REFRESCO_MS = 30000;

function App() {
  const [resumen, setResumen] = useState({
    total_votos: 0,
    casillas_capturadas: 0,
    casillas_registradas: 0,
    avance_captura: 0,
    partidos: [],
  });
  const [mensaje, setMensaje] = useState("");
  const [usuario, setUsuario] = useState(null);
  const [partidos, setPartidos] = useState([]);
  const [capturaSecciones, setCapturaSecciones] = useState([]);
  const [seccionActivaId, setSeccionActivaId] = useState(null);
  const [casillaActiva, setCasillaActiva] = useState(null);
  const [votosForm, setVotosForm] = useState({});
  const [cargandoCaptura, setCargandoCaptura] = useState(false);
  const [guardandoCaptura, setGuardandoCaptura] = useState(false);
  const [moduloActivo, setModuloActivo] = useState("");
  const [busquedaSeccion, setBusquedaSeccion] = useState("");
  const [busquedaPartido, setBusquedaPartido] = useState("");
  const [usuarioMenuAbierto, setUsuarioMenuAbierto] = useState(false);
  const [autenticado, setAutenticado] = useState(() => isAuthenticated());
  const [cargando, setCargando] = useState(() => isAuthenticated());
  const [ultimaActualizacion, setUltimaActualizacion] = useState(new Date());
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginCargando, setLoginCargando] = useState(false);

  async function cargarDatosIniciales() {
    try {
      const usuarioData = await getUsuarioActual();
      const puedeVerResultados = usuarioData.permisos.puede_ver_resultados;
      const puedeCapturar = usuarioData.permisos.puede_capturar_resultados;
      const [resumenData, partidosData] = await Promise.all([
        puedeVerResultados ? getResumen() : Promise.resolve(null),
        puedeCapturar ? getPartidos() : Promise.resolve([]),
      ]);

      if (resumenData) {
        setResumen(resumenData);
      }

      setUsuario(usuarioData);
      setPartidos(partidosData);
      setUltimaActualizacion(new Date());
      setModuloActivo(
        puedeVerResultados ? "resultados" : puedeCapturar ? "captura" : "",
      );
      setMensaje(
        !puedeVerResultados && !puedeCapturar
          ? "No tienes permisos asignados. Contacta al administrador."
          : "",
      );

      if (puedeCapturar) {
        await cargarCapturaSecciones();
      }
    } catch (error) {
      setMensaje(error.message);
      if (!isAuthenticated()) {
        setAutenticado(false);
      }
    } finally {
      setCargando(false);
    }
  }

  async function actualizarResumen() {
    const resumenData = await getResumen();
    setResumen(resumenData);
    setUltimaActualizacion(new Date());
  }

  async function cargarCapturaSecciones() {
    setCargandoCaptura(true);

    try {
      const seccionesData = await getCapturaSecciones();
      setCapturaSecciones(seccionesData);
      setSeccionActivaId((actual) => actual || seccionesData[0]?.id || null);
    } finally {
      setCargandoCaptura(false);
    }
  }

  async function seleccionarCasilla(casilla) {
    setCasillaActiva(casilla);
    setMensaje("");

    const resultados = await getResultadosCasilla(casilla.id);
    const votosPorPartido = Object.fromEntries(
      partidos.map((partido) => [partido.id, "0"]),
    );

    resultados.forEach((resultado) => {
      votosPorPartido[resultado.partido.id] = String(resultado.votos);
    });

    setVotosForm(votosPorPartido);
  }

  async function guardarCaptura(event) {
    event.preventDefault();

    if (!casillaActiva) return;

    setGuardandoCaptura(true);
    setMensaje("");

    try {
      const resultados = partidos.map((partido) => ({
        partido_id: partido.id,
        votos: Number(votosForm[partido.id] || 0),
      }));

      await guardarResultadosCasilla(casillaActiva.id, resultados);
      setMensaje("Resultados guardados correctamente.");
      setCasillaActiva({ ...casillaActiva, capturada: true });
      await Promise.all([
        usuario?.permisos?.puede_ver_resultados
          ? actualizarResumen()
          : Promise.resolve(),
        cargarCapturaSecciones(),
      ]);
    } catch (error) {
      setMensaje(error.message);
    } finally {
      setGuardandoCaptura(false);
    }
  }

  useEffect(() => {
    if (!autenticado) return undefined;

    const timeoutId = window.setTimeout(() => {
      cargarDatosIniciales();
    }, 0);

    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autenticado]);

  useEffect(() => {
    if (!autenticado || !usuario?.permisos?.puede_ver_resultados) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      actualizarResumen().catch((error) => {
        setMensaje(error.message);
        if (!isAuthenticated()) {
          setAutenticado(false);
        }
      });
    }, TIEMPO_REFRESCO_MS);

    return () => window.clearInterval(intervalId);
  }, [autenticado, usuario]);

  async function iniciarSesion(event) {
    event.preventDefault();
    setLoginCargando(true);
    setMensaje("");

    try {
      await login(loginForm.username, loginForm.password);
      setAutenticado(true);
      setCargando(true);
    } catch (error) {
      setMensaje(error.message);
    } finally {
      setLoginCargando(false);
    }
  }

  function cerrarSesion() {
    logout();
    setAutenticado(false);
    setMensaje("");
    setUsuario(null);
    setCapturaSecciones([]);
    setCasillaActiva(null);
    setModuloActivo("");
    setUsuarioMenuAbierto(false);
  }

  const partidosGrafica = useMemo(() => {
    return [...resumen.partidos].sort((a, b) => {
      const aEspecial = a.tipo !== "PARTIDO";
      const bEspecial = b.tipo !== "PARTIDO";
      const aSinVotos = (a.total_votos || 0) === 0;
      const bSinVotos = (b.total_votos || 0) === 0;

      if (aEspecial !== bEspecial) return aEspecial ? 1 : -1;
      if (aSinVotos !== bSinVotos) return aSinVotos ? 1 : -1;

      return (b.total_votos || 0) - (a.total_votos || 0);
    });
  }, [resumen.partidos]);

  const chartData = useMemo(
    () => ({
      labels: partidosGrafica.map((partido) => partido.siglas),
      datasets: [
        {
          label: "Votos",
          data: partidosGrafica.map((partido) => partido.total_votos),
          backgroundColor: partidosGrafica.map(
            (partido) => partido.color || "#0d6efd",
          ),
        },
      ],
    }),
    [partidosGrafica],
  );

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  };

  const casillasRegistradas = resumen.casillas_registradas || 0;
  const porcentajeCasillas = Math.min(100, resumen.avance_captura || 0);

  const totalFormateado = new Intl.NumberFormat("es-MX").format(
    resumen.total_votos,
  );

  const fechaCorte = new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(ultimaActualizacion);
  const segundosRefresco = TIEMPO_REFRESCO_MS / 1000;
  const puedeVerResultados = usuario?.permisos?.puede_ver_resultados || false;
  const puedeCapturarResultados =
    usuario?.permisos?.puede_capturar_resultados || false;
  const seccionesFiltradas = useMemo(() => {
    const busqueda = busquedaSeccion.trim().toLowerCase();

    if (!busqueda) return capturaSecciones;

    return capturaSecciones.filter((seccion) => {
      const numero = String(seccion.numero);
      const municipio = seccion.municipio.nombre.toLowerCase();

      return numero.includes(busqueda) || municipio.includes(busqueda);
    });
  }, [busquedaSeccion, capturaSecciones]);
  const partidosTabla = useMemo(() => {
    return [...resumen.partidos].sort((a, b) => {
      const aEspecial = a.tipo !== "PARTIDO";
      const bEspecial = b.tipo !== "PARTIDO";
      const aSinVotos = (a.total_votos || 0) === 0;
      const bSinVotos = (b.total_votos || 0) === 0;

      if (aEspecial !== bEspecial) return aEspecial ? 1 : -1;
      if (aSinVotos !== bSinVotos) return aSinVotos ? 1 : -1;

      return (b.total_votos || 0) - (a.total_votos || 0);
    });
  }, [resumen.partidos]);

  const partidosFiltrados = useMemo(() => {
    const busqueda = busquedaPartido.trim().toLowerCase();

    if (!busqueda) return partidosTabla;

    return partidosTabla.filter((partido) => {
      const siglas = partido.siglas.toLowerCase();
      const nombre = partido.nombre.toLowerCase();
      const tipo = partido.tipo_nombre.toLowerCase();

      return (
        siglas.includes(busqueda) ||
        nombre.includes(busqueda) ||
        tipo.includes(busqueda)
      );
    });
  }, [busquedaPartido, partidosTabla]);
  const seccionActiva = capturaSecciones.find(
    (seccion) => seccion.id === seccionActivaId,
  );

  function buscarSeccionRapida(event) {
    event.preventDefault();

    const primeraSeccion = seccionesFiltradas[0];

    if (!primeraSeccion) return;

    setSeccionActivaId(primeraSeccion.id);
    setCasillaActiva(null);
  }

  if (cargando) {
    return (
      <main className="container py-4">
        <p>Cargando...</p>
      </main>
    );
  }

  if (!autenticado) {
    return (
      <main className="login-page">
        <section className="login-panel">
          <div className="prep-logo login-logo">SM</div>
          <p className="prep-kicker">Sistema interno municipal</p>
          <h1>Iniciar sesion</h1>

          {mensaje && <div className="alert alert-info">{mensaje}</div>}

          <form onSubmit={iniciarSesion}>
            <div className="mb-3">
              <label className="form-label" htmlFor="username">
                Usuario
              </label>
              <input
                id="username"
                type="text"
                className="form-control"
                value={loginForm.username}
                onChange={(event) =>
                  setLoginForm({ ...loginForm, username: event.target.value })
                }
                autoComplete="username"
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label" htmlFor="password">
                Contrasena
              </label>
              <input
                id="password"
                type="password"
                className="form-control"
                value={loginForm.password}
                onChange={(event) =>
                  setLoginForm({ ...loginForm, password: event.target.value })
                }
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={loginCargando}
            >
              {loginCargando ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="prep-page">
      <header className="prep-topbar">
        <div className="prep-brand">
          <div className="prep-logo">SM</div>
          <div>
            <p className="prep-kicker">Sistema interno municipal</p>
            <h1 className="prep-title">Captura y Control de Votos</h1>
          </div>
        </div>

        {(puedeVerResultados || puedeCapturarResultados) && (
          <nav className="module-tabs" aria-label="Modulos">
            {puedeVerResultados && (
              <button
                type="button"
                className={moduloActivo === "resultados" ? "active" : ""}
                onClick={() => setModuloActivo("resultados")}
              >
                Resultados
              </button>
            )}
            {puedeCapturarResultados && (
              <button
                type="button"
                className={moduloActivo === "captura" ? "active" : ""}
                onClick={() => {
                  setModuloActivo("captura");
                  if (capturaSecciones.length === 0) {
                    cargarCapturaSecciones();
                  }
                }}
              >
                Captura
              </button>
            )}
          </nav>
        )}

        <div className="prep-actions">
          {moduloActivo === "resultados" && (
            <div className="prep-status">
              <span className="status-dot"></span>
              Actualizacion automatica
            </div>
          )}
          {usuario?.username && (
            <div className="user-menu">
              <button
                type="button"
                className="user-chip"
                title={`Usuario: ${usuario.username}`}
                aria-expanded={usuarioMenuAbierto}
                onClick={() => setUsuarioMenuAbierto(!usuarioMenuAbierto)}
              >
                <span>{usuario.username.charAt(0).toUpperCase()}</span>
                <strong>{usuario.username}</strong>
              </button>

              {usuarioMenuAbierto && (
                <div className="user-dropdown">
                  <div className="user-dropdown-header">
                    <span>Usuario</span>
                    <strong>{usuario.username}</strong>
                  </div>
                  <button
                    type="button"
                    className="logout-action"
                    onClick={cerrarSesion}
                  >
                    Cerrar sesion
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="prep-content">
        {mensaje && <div className="alert alert-info">{mensaje}</div>}

        {puedeVerResultados && moduloActivo === "resultados" && (
          <>
            <section className="prep-hero">
              <div>
                <p className="section-label">Resultados preliminares</p>
                <h2>Programa de captura por municipio, seccion y casilla</h2>
                <p className="text-muted mb-0">
                  Informacion operativa para seguimiento interno. No representa
                  voto ciudadano en linea.
                </p>
              </div>
              <div className="cutoff-panel">
                <span>Ultimo corte</span>
                <strong>{fechaCorte}</strong>
                <small>Refresco cada {segundosRefresco} segundos</small>
              </div>
            </section>

            <section className="metrics-grid">
              <div className="metric-card">
                <div className="metric-card-header">
                  <span>Votos capturados</span>
                  <i>V</i>
                </div>
                <strong>{totalFormateado}</strong>
              </div>
              <div className="metric-card">
                <div className="metric-card-header">
                  <span>Casillas capturadas</span>
                  <i>C</i>
                </div>
                <strong>{resumen.casillas_capturadas}</strong>
              </div>
              <div className="metric-card">
                <div className="metric-card-header">
                  <span>Casillas registradas</span>
                  <i>R</i>
                </div>
                <strong>{casillasRegistradas}</strong>
              </div>
              <div className="metric-card">
                <div className="metric-card-header">
                  <span>Avance de captura</span>
                  <i>%</i>
                </div>
                <strong>{porcentajeCasillas}%</strong>
                <div className="progress prep-progress" aria-hidden="true">
                  <div
                    className="progress-bar"
                    style={{ width: `${porcentajeCasillas}%` }}
                  ></div>
                </div>
              </div>
            </section>
          </>
        )}

      {puedeCapturarResultados && moduloActivo === "captura" && (
        <section className="panel capture-panel">
          <div className="panel-header">
            <div>
              <p className="section-label">Captura</p>
              <h2>Registro de votos por seccion y casilla</h2>
            </div>
            <button
              type="button"
              className="btn btn-outline-primary btn-sm"
              onClick={cargarCapturaSecciones}
              disabled={cargandoCaptura}
            >
              {cargandoCaptura ? "Actualizando..." : "Actualizar"}
            </button>
          </div>

          <div className="capture-layout">
            <aside className="section-list">
              <form className="section-search" onSubmit={buscarSeccionRapida}>
                <input
                  type="search"
                  className="form-control"
                  placeholder="Buscar seccion"
                  value={busquedaSeccion}
                  onChange={(event) => setBusquedaSeccion(event.target.value)}
                />
                <button type="submit" className="btn btn-primary btn-sm">
                  Buscar
                </button>
              </form>

              <div className="section-scroll">
                {seccionesFiltradas.length === 0 ? (
                  <div className="section-empty">Sin coincidencias</div>
                ) : (
                  seccionesFiltradas.map((seccion) => (
                    <button
                      key={seccion.id}
                      type="button"
                      className={`section-option ${
                        seccion.id === seccionActivaId ? "active" : ""
                      }`}
                      onClick={() => {
                        setSeccionActivaId(seccion.id);
                        setCasillaActiva(null);
                      }}
                    >
                      <span>
                        Seccion {seccion.numero}
                        <small>{seccion.municipio.nombre}</small>
                      </span>
                      <strong>
                        {seccion.casillas_capturadas}/{seccion.total_casillas}
                      </strong>
                    </button>
                  ))
                )}
              </div>
            </aside>

            <div className="booth-workspace">
              {seccionActiva ? (
                <>
                  <div className="booth-summary">
                    <div>
                      <span>Capturadas</span>
                      <strong>{seccionActiva.casillas_capturadas}</strong>
                    </div>
                    <div>
                      <span>Pendientes</span>
                      <strong>{seccionActiva.casillas_pendientes}</strong>
                    </div>
                    <div>
                      <span>Total</span>
                      <strong>{seccionActiva.total_casillas}</strong>
                    </div>
                  </div>

                  <div className="booth-grid">
                    {seccionActiva.casillas.map((casilla) => (
                      <button
                        key={casilla.id}
                        type="button"
                        className={`booth-button ${
                          casilla.capturada ? "captured" : "pending"
                        } ${casillaActiva?.id === casilla.id ? "active" : ""}`}
                        onClick={() => seleccionarCasilla(casilla)}
                      >
                        <span>
                          {casilla.tipo_nombre} {casilla.numero}
                        </span>
                        <small>
                          {casilla.capturada ? "Capturada" : "Pendiente"}
                        </small>
                      </button>
                    ))}
                  </div>

                  {casillaActiva ? (
                    <form className="vote-form" onSubmit={guardarCaptura}>
                      <div className="vote-form-header">
                        <div>
                          <p className="section-label">Casilla</p>
                          <h3>
                            {casillaActiva.tipo_nombre} {casillaActiva.numero}
                          </h3>
                        </div>
                        <span
                          className={`capture-badge ${
                            casillaActiva.capturada ? "captured" : "pending"
                          }`}
                        >
                          {casillaActiva.capturada ? "Capturada" : "Pendiente"}
                        </span>
                      </div>

                      <div className="vote-inputs">
                        {partidos.map((partido) => (
                          <label key={partido.id} className="vote-row">
                            <span>
                              {partido.imagen_url ? (
                                <img
                                  className="party-thumbnail"
                                  src={partido.imagen_url}
                                  alt={`Logo de ${partido.siglas}`}
                                />
                              ) : (
                                <span
                                  className="party-swatch"
                                  style={{ backgroundColor: partido.color }}
                                ></span>
                              )}
                              <strong>{partido.siglas}</strong>
                              {partido.tipo !== "PARTIDO" && (
                                <small className="party-type">
                                  {partido.tipo_nombre}
                                </small>
                              )}
                            </span>
                            <input
                              type="number"
                              className="form-control"
                              min="0"
                              disabled={casillaActiva.capturada}
                              value={votosForm[partido.id] || ""}
                              onChange={(event) =>
                                setVotosForm({
                                  ...votosForm,
                                  [partido.id]: event.target.value,
                                })
                              }
                            />
                          </label>
                        ))}
                      </div>

                      {casillaActiva.capturada ? (
                        <div className="capture-locked">
                          Esta casilla ya fue capturada.
                        </div>
                      ) : (
                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={guardandoCaptura}
                        >
                          {guardandoCaptura ? "Guardando..." : "Guardar votos"}
                        </button>
                      )}
                    </form>
                  ) : (
                    <div className="empty-capture">
                      Selecciona una casilla para capturar sus votos.
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-capture">
                  No hay secciones registradas para captura.
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {puedeVerResultados && moduloActivo === "resultados" && (
        <section className="prep-dashboard">
          <div className="panel chart-panel">
            <div className="panel-header">
              <div>
                <p className="section-label">Grafica</p>
                <h2>Votos por partido</h2>
              </div>
            </div>
            {resumen.partidos.length === 0 ? (
              <p className="text-muted mb-0">
                Aun no hay resultados capturados.
              </p>
            ) : (
              <div className="dashboard-chart">
                <Bar data={chartData} options={chartOptions} />
              </div>
            )}
          </div>

          <div className="panel results-panel">
            <div className="panel-header">
              <div>
                <p className="section-label">Tabla</p>
                <h2>Resumen por partido</h2>
              </div>
              <label className="party-filter">
                <span>Filtrar partido</span>
                <input
                  type="search"
                  className="form-control"
                  placeholder="Buscar partido"
                  value={busquedaPartido}
                  onChange={(event) => setBusquedaPartido(event.target.value)}
                />
              </label>
            </div>
            <div className="table-responsive">
              <table className="table prep-table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Partido</th>
                    <th className="text-end">Votos</th>
                    <th className="text-end">Porcentaje</th>
                  </tr>
                </thead>
                <tbody>
                  {partidosFiltrados.map((partido) => {
                    const porcentaje =
                      resumen.total_votos === 0
                        ? 0
                        : (partido.total_votos / resumen.total_votos) * 100;

                    return (
                      <tr key={partido.partido_id}>
                        <td>
                          {partido.imagen_url ? (
                            <img
                              className="party-thumbnail"
                              src={partido.imagen_url}
                              alt={`Logo de ${partido.siglas}`}
                            />
                          ) : (
                            <span
                              className="party-swatch"
                              style={{ backgroundColor: partido.color }}
                            ></span>
                          )}
                          <strong>{partido.siglas}</strong>
                          <span className="party-name">{partido.nombre}</span>
                          {partido.tipo !== "PARTIDO" && (
                            <span className="party-name party-type">
                              {partido.tipo_nombre}
                            </span>
                          )}
                        </td>
                        <td className="text-end">
                          {new Intl.NumberFormat("es-MX").format(
                            partido.total_votos,
                          )}
                        </td>
                      <td className="text-end">{porcentaje.toFixed(2)}%</td>
                    </tr>
                  );
                })}
                  {partidosFiltrados.length === 0 && (
                    <tr>
                      <td colSpan="3" className="empty-table">
                        No hay partidos con ese filtro.
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
            </div>
          </div>
        </section>
      )}

        {!puedeVerResultados && !puedeCapturarResultados && (
          <section className="panel empty-permissions">
            No tienes permisos asignados. Contacta al administrador.
          </section>
        )}
      </div>
    </main>
  );
}

export default App;
