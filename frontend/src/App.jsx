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
  getResumen,
  isAuthenticated,
  login,
  logout,
} from "./api";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

function App() {
  const [resumen, setResumen] = useState({
    total_votos: 0,
    casillas_capturadas: 0,
    casillas_registradas: 0,
    avance_captura: 0,
    partidos: [],
  });
  const [mensaje, setMensaje] = useState("");
  const [autenticado, setAutenticado] = useState(() => isAuthenticated());
  const [cargando, setCargando] = useState(() => isAuthenticated());
  const [ultimaActualizacion, setUltimaActualizacion] = useState(new Date());
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginCargando, setLoginCargando] = useState(false);

  async function cargarDatosIniciales() {
    try {
      const resumenData = await getResumen();
      setResumen(resumenData);
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

  useEffect(() => {
    if (!autenticado) return undefined;

    const timeoutId = window.setTimeout(() => {
      cargarDatosIniciales();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [autenticado]);

  useEffect(() => {
    if (!autenticado) return undefined;

    const intervalId = window.setInterval(() => {
      actualizarResumen().catch((error) => {
        setMensaje(error.message);
        if (!isAuthenticated()) {
          setAutenticado(false);
        }
      });
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [autenticado]);

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
  }

  const chartData = useMemo(
    () => ({
      labels: resumen.partidos.map((partido) => partido.siglas),
      datasets: [
        {
          label: "Votos",
          data: resumen.partidos.map((partido) => partido.total_votos),
          backgroundColor: resumen.partidos.map(
            (partido) => partido.color || "#0d6efd",
          ),
        },
      ],
    }),
    [resumen],
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
        <div className="prep-status">
          <span className="status-dot"></span>
          Actualizacion automatica
        </div>
        <button type="button" className="btn btn-light" onClick={cerrarSesion}>
          Cerrar sesion
        </button>
      </header>

      {mensaje && <div className="alert alert-info">{mensaje}</div>}

      <section className="prep-hero">
        <div>
          <p className="section-label">Resultados preliminares</p>
          <h2>Programa de captura por municipio, seccion y casilla</h2>
          <p className="text-muted mb-0">
            Informacion operativa para seguimiento interno. No representa voto
            ciudadano en linea.
          </p>
        </div>
        <div className="cutoff-panel">
          <span>Ultimo corte</span>
          <strong>{fechaCorte}</strong>
          <small>Refresco cada 5 segundos</small>
        </div>
      </section>

      <section className="metrics-grid">
        <div className="metric-card">
          <span>Votos capturados</span>
          <strong>{totalFormateado}</strong>
        </div>
        <div className="metric-card">
          <span>Casillas capturadas</span>
          <strong>{resumen.casillas_capturadas}</strong>
        </div>
        <div className="metric-card">
          <span>Casillas registradas</span>
          <strong>{casillasRegistradas}</strong>
        </div>
        <div className="metric-card">
          <span>Avance de captura</span>
          <strong>{porcentajeCasillas}%</strong>
          <div className="progress prep-progress" aria-hidden="true">
            <div
              className="progress-bar"
              style={{ width: `${porcentajeCasillas}%` }}
            ></div>
          </div>
        </div>
      </section>

      <section className="prep-dashboard">
        <div className="panel chart-panel">
          <div className="panel-header">
            <div>
              <p className="section-label">Grafica</p>
              <h2>Votos por partido</h2>
            </div>
          </div>
          {resumen.partidos.length === 0 ? (
            <p className="text-muted mb-0">Aun no hay resultados capturados.</p>
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
                {resumen.partidos.map((partido) => {
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
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;
