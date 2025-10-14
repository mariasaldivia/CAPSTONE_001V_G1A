import React, { useState } from "react";
import PanelLateralD from "../../components/PanelLateralD";
import "./GestionSocios.css";


const GestionSocios = () => {
    const [socios, setSocios] = useState([
    { nombre: "Mario", apellido: "Soto", rut: "9.876.543-2", direccion: "Pje. Las Rosas 12", correo: "mario@gmail.com", telefono: "934567812" },
    { nombre: "Ana", apellido: "Torres", rut: "11.223.344-5", direccion: "Las Encinas 88", correo: "ana@gmail.com", telefono: "956789123" },
    { nombre: "Carlos", apellido: "Rivas", rut: "7.654.321-0", direccion: "El Bosque 14", correo: "carlos@gmail.com", telefono: "978123456" },
  ]);

  const [postulantes, setPostulantes] = useState([
    {
      name: "Jorge",
      lastname: "Soto",
      rut: "15.678.123-3",
      birthdate: "1992-03-12",
      street: "Los Pinos",
      number: "234",
      email: "jorge@gmail.com",
      phone: "912345678",
      password: "********",
      confirmPassword: "********",
    },
    {
      name: "Camila",
      lastname: "Reyes",
      rut: "16.543.210-2",
      birthdate: "1995-08-20",
      street: "El Aromo",
      number: "456",
      email: "camila@gmail.com",
      phone: "987654321",
      password: "********",
      confirmPassword: "********",
    },
    {
      name: "Cecilia",
      lastname: "Poblete",
      rut: "18.533.023-1",
      birthdate: "1995-08-20",
      street: "El Aromo",
      number: "356",
      email: "cecilia@gmail.com",
      phone: "938261789",
      password: "********",
      confirmPassword: "********",
    },
    {
      name: "Gipson",
      lastname: "Matamala",
      rut: "20.334.425-k",
      birthdate: "1995-08-20",
      street: "Los Pinos",
      number: "142",
      email: "gmatamala@gmail.com",
      phone: "978463355",
      password: "********",
      confirmPassword: "********",
    },
  ]);
  const [filtro, setFiltro] = useState("");
  /* const [postulanteSeleccionado, setPostulanteSeleccionado] = useState(null); */
  const [detalle, setDetalle] = useState(null);

  const aceptarPostulante = (postulante) => {
    const nuevoSocio = {
      nombre: postulante.name,
      apellido: postulante.lastname,
      rut: postulante.rut,
      direccion: `${postulante.street} ${postulante.number}`,
      correo: postulante.email,
      telefono: postulante.phone,
    };
    setSocios([...socios, nuevoSocio]);
    setPostulantes(postulantes.filter((p) => p.rut !== postulante.rut));
    setDetalle(null);
  };

  const rechazarPostulante = (rut) => {
    setPostulantes(postulantes.filter((p) => p.rut !== rut));
    setDetalle(null);
  };
  

  return (
    
    <div className="gestion-container">
      {/* === PANEL SOCIOS === */}
      <div className="panel">
        <h2>Socios Inscritos ({socios.length})</h2>
        <input
        type="text"
        placeholder="🔍 Buscar socio por nombre o RUT..."
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
        className="w-full p-2 mb-6 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
        <div className="tabla-socios">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>RUT</th>
                <th>Dirección</th>
                <th>Correo</th>
                <th>Teléfono</th>
              </tr>
            </thead>
            <tbody>
              {socios.map((s, i) => (
                <tr key={i}>
                  <td>{s.nombre} {s.apellido}</td>
                  <td>{s.rut}</td>
                  <td>{s.direccion}</td>
                  <td>{s.correo}</td>
                  <td>{s.telefono}</td>
                </tr>
              ))}
            </tbody>
            
          </table>
        </div>
      </div>

      {/* === PANEL POSTULANTES === */}
      <div className="panel">
        <h2>Postulantes ({postulantes.length})</h2>
        <div className="postulantes-list">
          {postulantes.map((p, i) => (
            <div key={i} className="postulante-card">
              <div>
                <strong>{p.name} {p.lastname}</strong>
                <p>{p.rut}</p>
              </div>
              <button className="revisar-btn" onClick={() => setDetalle(p)}>
                Revisar
              </button>
            </div>
          ))}
          {postulantes.length === 0 && (
            <p className="sin-postulantes">No hay postulantes pendientes.</p>
          )}
        </div>
      </div>

      {/* === MODAL DETALLE === */}
      {detalle && (
        <div className="modal-overlay" onClick={() => setDetalle(null)}>
          <div className="modal-detalle" onClick={(e) => e.stopPropagation()}>
            <h3>Detalle del Postulante</h3>
            <div className="modal-body">
              <p><strong>Nombre:</strong> {detalle.name} {detalle.lastname}</p>
              <p><strong>RUT:</strong> {detalle.rut}</p>
              <p><strong>Fecha de Nacimiento:</strong> {detalle.birthdate}</p>
              <p><strong>Dirección:</strong> {detalle.street} {detalle.number}</p>
              <p><strong>Correo:</strong> {detalle.email}</p>
              <p><strong>Teléfono:</strong> {detalle.phone}</p>
            </div>
            <div className="acciones">
              <button className="btn-aceptar" onClick={() => aceptarPostulante(detalle)}>Aceptar</button>
              <button className="btn-rechazar" onClick={() => rechazarPostulante(detalle.rut)}>Rechazar</button>
              <button className="btn-cerrar" onClick={() => setDetalle(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


export default function GestionDeSocios(){
   const user = { nombre: "Nombre Directiva", cargo: "Cargo" };
    return (
      <PanelLateralD title="Gestion Socios" user={user} showTopUser={false}>
        <GestionSocios />
      </PanelLateralD>
    );
}

