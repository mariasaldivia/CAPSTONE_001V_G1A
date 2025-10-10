import React, { useState } from "react";
import "./GestionSocios.css";

function GestionSocios() {
  const [socios] = useState([
    { name: "Ana", lastname: "Pérez", rut: "11.111.111-1", street: "Av. Las Rosas", number: "120", email: "ana.perez@mail.com", phone: "+56 9 7777 1111" },
    { name: "Carlos", lastname: "Muñoz", rut: "12.222.222-2", street: "Calle Los Álamos", number: "33", email: "carlos.m@mail.com", phone: "+56 9 5555 2222" },
    { name: "María", lastname: "Gómez", rut: "13.333.333-3", street: "Av. Central", number: "456", email: "maria.g@mail.com", phone: "+56 9 4444 3333" },
    { name: "Luis", lastname: "Ramírez", rut: "14.444.444-4", street: "Pje. Estrella", number: "22", email: "luis.r@mail.com", phone: "+56 9 2222 4444" },
    { name: "Fernanda", lastname: "Leiva", rut: "15.555.555-5", street: "Camino Real", number: "80", email: "fer.leiva@mail.com", phone: "+56 9 1111 5555" },
  ]);

  const [postulantes, setPostulantes] = useState([
    { name: "Camila", lastname: "Soto", rut: "21.111.111-1", birthdate: "2000-02-15", street: "Los Jardines", number: "12", email: "camila@mail.com", phone: "+56 9 9999 1111" },
    { name: "Tomás", lastname: "Fuentes", rut: "22.222.222-2", birthdate: "1998-11-25", street: "El Roble", number: "9", email: "tomas@mail.com", phone: "+56 9 5555 2222" },
    { name: "Isidora", lastname: "López", rut: "23.333.333-3", birthdate: "2002-05-08", street: "Av. Norte", number: "35", email: "isi@mail.com", phone: "+56 9 3333 3333" },
  ]);

  const aceptarPostulante = (rut) => {
    const postulante = postulantes.find((p) => p.rut === rut);
    if (postulante) {
      setPostulantes(postulantes.filter((p) => p.rut !== rut));
      alert(`✅ ${postulante.name} ${postulante.lastname} ahora es socio.`);
    }
  };

  const rechazarPostulante = (rut) => {
    const postulante = postulantes.find((p) => p.rut === rut);
    if (postulante) {
      setPostulantes(postulantes.filter((p) => p.rut !== rut));
      alert(`❌ Postulación rechazada para ${postulante.name} ${postulante.lastname}.`);
    }
  };

  return (
    
    <div className="gs-container">
      <h2 className="gs-title">👥 Gestión de Socios Vecinales</h2>

      {/* SOCIOS */}
      <div className="gs-section">
        <h3 className="gs-subtitle">Socios Inscritos ({socios.length})</h3>
        <table className="gs-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>RUT</th>
              <th>Dirección</th>
              <th>Email</th>
              <th>Teléfono</th>
            </tr>
          </thead>
          <tbody>
            {socios.map((s) => (
              <tr key={s.rut}>
                <td>{s.name} {s.lastname}</td>
                <td>{s.rut}</td>
                <td>{s.street} #{s.number}</td>
                <td>{s.email}</td>
                <td>{s.phone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* POSTULANTES */}
      <div className="gs-section">
        <h3 className="gs-subtitle">Postulantes ({postulantes.length})</h3>
        <table className="gs-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>RUT</th>
              <th>Fecha Nac.</th>
              <th>Dirección</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {postulantes.map((p) => (
              <tr key={p.rut}>
                <td>{p.name} {p.lastname}</td>
                <td>{p.rut}</td>
                <td>{p.birthdate}</td>
                <td>{p.street} #{p.number}</td>
                <td>{p.email}</td>
                <td>{p.phone}</td>
                <td>
                  <button className="aceptar" onClick={() => aceptarPostulante(p.rut)}>Aceptar</button>
                  <button className="rechazar" onClick={() => rechazarPostulante(p.rut)}>Rechazar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default GestionSocios;

