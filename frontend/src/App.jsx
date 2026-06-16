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
  getCasillas,
  getPartidos,
  getResultadosCasilla,
  getResumen,
  guardarResultadosCasilla,
} from "./api";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

function App() {
  const [casillas, setCasillas] = useState([]);
  const [partidos, setPartidos] = useState([]);
  const [resumen, setResumen] = useState({
    total_votos: 0,
    casillas_capturadas: 0,
    partidos: [],
  });
  const [casillaSeleccionada, setCasillaSeleccionada] = useState(null);
  const [votos, setVotos] = useState({});
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      actualizarResumen().catch((error) => {
        setMensaje(error.message);
      });
    }, 60000);

    return () => window.clearInterval(intervalId);
  }, []);

  async function cargarDatosIniciales() {
    try {
      const [casillasData, partidosData, resumenData] = await Promise.all([
        getCasillas(),
        getPartidos(),
        getResumen(),
      ]);

      setCasillas(casillasData);
      setPartidos(partidosData);
      setResumen(resumenData);
    } catch (error) {
      setMensaje(error.message);
    } finally {
      setCargando(false);
    }
  }

  async function actualizarResumen() {
    const resumenData = await getResumen();
    setResumen(resumenData);
  }

  async function seleccionarCasilla(casilla) {
    setCasillaSeleccionada(casilla);
    setMensaje("");

    try {
      const resultados = await getResultadosCasilla(casilla.id);
      const votosActuales = {};

      resultados.forEach((resultado) => {
        votosActuales[resultado.partido.id] = resultado.votos;
      });

      partidos.forEach((partido) => {
        if (votosActuales[partido.id] === undefined) {
          votosActuales[partido.id] = 0;
        }
      });

      setVotos(votosActuales);
    } catch (error) {
      setMensaje(error.message);
    }
  }

  function cambiarVotos(partidoId, valor) {
    setVotos({
      ...votos,
      [partidoId]: Number(valor),
    });
  }

  async function guardarVotos(event) {
    event.preventDefault();

    if (!casillaSeleccionada) {
      setMensaje("Selecciona una casilla primero.");
      return;
    }

    try {
      const resultados = partidos.map((partido) => ({
        partido_id: partido.id,
        votos: votos[partido.id] || 0,
      }));

      await guardarResultadosCasilla(casillaSeleccionada.id, resultados);
      await actualizarResumen();
      setMensaje("Resultados guardados correctamente.");
    } catch (error) {
      setMensaje(error.message);
    }
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

  if (cargando) {
    return (
      <main className="container py-4">
        <p>Cargando...</p>
      </main>
    );
  }

  return (
    <main className="container py-4">
      <div className="mb-4">
        <h1 className="h3 mb-1">Sistema Municipal de Votos</h1>
        <p className="text-muted mb-0">
          Captura interna de resultados por municipio, seccion y casilla.
        </p>
      </div>

      {mensaje && <div className="alert alert-info">{mensaje}</div>}

      <section className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-body">
              <div className="text-muted small">Votos capturados</div>
              <div className="display-6">{resumen.total_votos}</div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-body">
              <div className="text-muted small">Casillas capturadas</div>
              <div className="display-6">{resumen.casillas_capturadas}</div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-body">
              <div className="text-muted small">Casillas registradas</div>
              <div className="display-6">{casillas.length}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="card mb-4">
        <div className="card-header">Resumen por partido</div>
        <div className="card-body">
          {resumen.partidos.length === 0 ? (
            <p className="text-muted mb-0">
              Aun no hay resultados capturados.
            </p>
          ) : (
            <div style={{ height: "320px" }}>
              <Bar data={chartData} options={chartOptions} />
            </div>
          )}
        </div>
      </section>

      <div className="row g-4">
        <section className="col-lg-5">
          <div className="card">
            <div className="card-header">Casillas</div>
            <div className="list-group list-group-flush">
              {casillas.map((casilla) => (
                <button
                  key={casilla.id}
                  type="button"
                  className={`list-group-item list-group-item-action ${
                    casillaSeleccionada?.id === casilla.id ? "active" : ""
                  }`}
                  onClick={() => seleccionarCasilla(casilla)}
                >
                  <strong>{casilla.seccion.municipio.nombre}</strong>
                  <br />
                  Seccion {casilla.seccion.numero} / {casilla.tipo_nombre}{" "}
                  {casilla.numero}
                </button>
              ))}

              {casillas.length === 0 && (
                <div className="list-group-item text-muted">
                  No hay casillas registradas.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="col-lg-7">
          <div className="card">
            <div className="card-header">Captura de resultados</div>

            {!casillaSeleccionada ? (
              <div className="card-body text-muted">
                Selecciona una casilla para capturar votos.
              </div>
            ) : (
              <form onSubmit={guardarVotos}>
                <div className="card-body">
                  <h2 className="h5">
                    Seccion {casillaSeleccionada.seccion.numero} /{" "}
                    {casillaSeleccionada.tipo_nombre}{" "}
                    {casillaSeleccionada.numero}
                  </h2>

                  <div className="row g-3 mt-2">
                    {partidos.map((partido) => (
                      <div className="col-md-6" key={partido.id}>
                        <label className="form-label">
                          {partido.siglas} - {partido.nombre}
                        </label>
                        <input
                          type="number"
                          min="0"
                          className="form-control"
                          value={votos[partido.id] ?? 0}
                          onChange={(event) =>
                            cambiarVotos(partido.id, event.target.value)
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card-footer text-end">
                  <button type="submit" className="btn btn-primary">
                    Guardar resultados
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

export default App;
