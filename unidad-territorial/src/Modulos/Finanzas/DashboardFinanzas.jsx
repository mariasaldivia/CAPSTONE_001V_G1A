import React, { useState, useEffect, useCallback, useMemo} from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import {
  obtenerDashboard,
  obtenerMovimientos,
} from "../../api/finanzasApi";

import FormularioMovimiento from "./FormularioMovimiento"; 
import "./DashboardFinanzas.css";
import PanelLateralD from "../../components/PanelLateralD";

//  COMPONENTES DE CHART.JS
ChartJS.register(ArcElement, Tooltip, Legend);
// --- Pequeña función para formatear dinero ---
const formatCurrency = (value) => {
  // ... (tu función de formato está perfecta)
  const numberValue = Number(value) || 0;
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0, // Sin decimales
  }).format(numberValue);
};

// --- CONTENIDO DEL DASHBOARD ---
function DashboardFinanzasContent() {
    const [dashboard, setDashboard] = useState({
      SaldoNeto: 0,
      TotalIngresos: 0,
      TotalEgresos: 0
    });
    const [movimientos, setMovimientos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const cargarDatos = useCallback(async () => {
      setLoading(true);
      setError(null);
      try {
        // Pedimos los datos del dashboard y los movimientos al mismo tiempo
        const [dashboardData, movimientosData] = await Promise.all([
          obtenerDashboard(),
          obtenerMovimientos(),
        ]);

        setDashboard(dashboardData);
        setMovimientos(movimientosData);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, []);
    // Cargar TODOS los datos al iniciar
    useEffect(() => {
        cargarDatos();
    }, [cargarDatos]); 

    const handleMovimientoCreado = () => {

        cargarDatos(); 
    };

   // --- PROCESAMIENTO GRÁFICO 1: EGRESOS ---
  const datosGraficoEgresos = useMemo(() => {
    const egresos = movimientos.filter(m => m.Tipo === 'Egreso');
    
    // Agrupamos por categoría y sumamos
    const categoriasMap = new Map();
    egresos.forEach(mov => {
      const totalAnterior = categoriasMap.get(mov.Categoria) || 0;
      categoriasMap.set(mov.Categoria, totalAnterior + mov.Monto);
    });

    // Convertimos el Map a los arrays que Chart.js necesita
    const labels = Array.from(categoriasMap.keys());
    const data = Array.from(categoriasMap.values());

    return {
      labels: labels,
      datasets: [
        {
          label: 'Total Egresos',
          data: data,
          // Colores (puedes añadir más si tienes más categorías)
          backgroundColor: [
            'rgba(220, 38, 38, 0.7)',  // --bad (tu rojo)
            'rgba(249, 115, 22, 0.7)', // --content-accent (tu naranjo)
            'rgba(234, 179, 8, 0.7)',  // --warn (tu amarillo)
            'rgba(30, 64, 175, 0.7)',  // --content-text (tu azul)
            '#6b7280', // Gris
          ],
          borderColor: '#ffffff',
          borderWidth: 2,
        },
      ],
    };
  }, [movimientos]); // Se recalcula solo si 'movimientos' cambia

  // 👈 --- PROCESAMIENTO GRÁFICO 2: INGRESOS (NUEVO) ---
  const datosGraficoIngresos = useMemo(() => {
    const ingresos = movimientos.filter(m => m.Tipo === 'Ingreso');
    const categoriasMap = new Map();
    ingresos.forEach(mov => {
      const totalAnterior = categoriasMap.get(mov.Categoria) || 0;
      categoriasMap.set(mov.Categoria, totalAnterior + mov.Monto);
    });
    const labels = Array.from(categoriasMap.keys());
    const data = Array.from(categoriasMap.values());
    return {
      labels: labels,
      datasets: [
        {
          label: 'Total Ingesos',
          data: data,
          backgroundColor: [
            'rgba(22, 163, 74, 0.7)',   // --ok (Verde)
            'rgba(30, 64, 175, 0.7)',  // --content-text (Azul)
            'rgba(59, 130, 246, 0.7)', // Azul claro
            'rgba(20, 184, 166, 0.7)', // Teal
            '#6b7280', // Gris
          ],
          borderColor: '#ffffff',
          borderWidth: 2,
        },
      ],
    };
  }, [movimientos]);

     // --- Renderizado ---
    if (loading && movimientos.length === 0) {
        return <div className="finanzas-container">Cargando finanzas...</div>;
    }

    if (error) {
        return <div className="finanzas-container error-box">Error: {error}</div>;
    }

  return (
    <div className="finanzas-container">
      <h2 className="finanzas-title">Panel de Finanzas</h2>
      {/* EL DASHBOARD (TARJETAS) */}
      <section className="dashboard-summary">
        {/* Tarjeta 1: Total Ingresos */}
        <div className="summary-card card-ingreso">
          <h3>Total Ingresos</h3>
          <p>{formatCurrency(dashboard.TotalIngresos)}</p>
        </div>

        {/* Tarjeta 2: Total Egresos */}
        <div className="summary-card card-egreso">
          <h3>Total Egresos</h3>
          <p>{formatCurrency(dashboard.TotalEgresos)}</p>
        </div>

        {/* Tarjeta 3: Saldo Neto */}
        <div className="summary-card card-saldo">
          <h3>Saldo Neto</h3>
          <p>{formatCurrency(dashboard.SaldoNeto)}</p>
        </div>
      </section>

        {/* FORMULARIOS DE ACCIÓN Y GRÁFICO */}
        <section className="dashboard-main-content">
            {/* Columna 1: Formularios */}
            <div className="paneles-accion-wrapper">
            <FormularioMovimiento 
                tipo="Ingreso" 
                onMovimientoCreado={handleMovimientoCreado} 
            />
            <FormularioMovimiento 
                tipo="Egreso" 
                onMovimientoCreado={handleMovimientoCreado} 
            />
            </div>
              <section className="paneles-graficos">
              {/* Gráfico Ingresos*/}
              <div className="panel-grafico">
              <h3>ingresos por Categoría</h3>
              {movimientos.filter(m => m.Tipo === 'Egreso').length > 0 ? (
                  <div className="grafico-container">
                  <Doughnut 
                      data={datosGraficoIngresos} 
                      options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                          legend: {
                          position: 'top',
                          },
                      },
                      }}
                  />
                  </div>
              ) : (
                  <p>No hay ingresos registrados para mostrar en el gráfico.</p>
              )}
              </div>
              {/* Gráfico Egresos */}
              <div className="panel-grafico">
              <h3>Egresos por Categoría</h3>
              {movimientos.filter(m => m.Tipo === 'Egreso').length > 0 ? (
                  <div className="grafico-container">
                  <Doughnut 
                      data={datosGraficoEgresos} 
                      options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                          legend: {
                          position: 'top',
                          },
                      },
                      }}
                  />
                  </div>
              ) : (
                  <p>No hay egresos registrados para mostrar en el gráfico.</p>
              )}
              </div>
            </section>
        </section>

      {/* ==================
            EL PANEL (TABLA)
          ================== */}
      <section className="panel-movimientos">
        <h3>Últimos Movimientos</h3>
        <div className="table-wrapper">
          <table className="movimientos-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Descripción</th>
                <th>Categoría</th>
                <th>Tipo</th>
                <th>Monto</th>
                <th>Registrado por</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.length === 0 ? (
                <tr>
                  <td colSpan="6">No hay movimientos registrados aún.</td>
                </tr>
              ) : (
                movimientos.map((mov) => (
                  <tr key={mov.ID_Movimiento}>
                    <td>{new Date(mov.Fecha).toLocaleDateString("es-CL")}</td>
                    <td>{mov.Descripcion}</td>
                    <td>{mov.Categoria}</td>
                    <td>
                      <span
                        className={
                          mov.Tipo === "Ingreso"
                            ? "tipo-ingreso"
                            : "tipo-egreso"
                        }
                      >
                        {mov.Tipo}
                      </span>
                    </td>
                    <td
                      className={
                        mov.Tipo === "Ingreso"
                          ? "monto-ingreso"
                          : "monto-egreso"
                      }
                    >
                      {/* Mostramos + o - según el tipo */}
                      {mov.Tipo === "Ingreso" ? "+ " : "- "}
                      {formatCurrency(mov.Monto)}
                    </td>
                    <td>{mov.RegistradoPor}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default function DashboardFinanzasPage() {
  const [usuario, setUsuario] = useState(null);
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("usuario");
      if (storedUser) setUsuario(JSON.parse(storedUser));
    } catch (e) { console.error(e); }
  }, []);

  return (
    <PanelLateralD title="Finanzas" showTopUser={false}>
      <DashboardFinanzasContent />
    </PanelLateralD>
  );
}