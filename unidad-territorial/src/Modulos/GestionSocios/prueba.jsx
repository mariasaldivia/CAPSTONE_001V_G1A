import React, { useState } from "react";

const GestionSocios = () => {
  const [socios, setSocios] = useState([
    { id: 1, name: "Ana Pérez", rut: "12.345.678-9", email: "ana@mail.com", telefono: "987654321" },
    { id: 2, name: "Carlos Soto", rut: "22.111.222-3", email: "carlos@mail.com", telefono: "912345678" },
  ]);

  const [postulantes, setPostulantes] = useState([
    {
      id: 1,
      name: "María",
      lastname: "González",
      rut: "19.456.789-1",
      birthdate: "1995-05-12",
      street: "Av. Los Olmos",
      number: "123",
      email: "maria@mail.com",
      phone: "945678123",
      password: "",
      confirmPassword: "",
    },
  ]);

  const [filtro, setFiltro] = useState("");
  const [postulanteSeleccionado, setPostulanteSeleccionado] = useState(null);

  const aceptarPostulante = (postulante) => {
    const nuevoSocio = {
      id: socios.length + 1,
      name: `${postulante.name} ${postulante.lastname}`,
      rut: postulante.rut,
      email: postulante.email,
      telefono: postulante.phone,
    };
    setSocios([...socios, nuevoSocio]);
    setPostulantes(postulantes.filter((p) => p.id !== postulante.id));
  };

  const sociosFiltrados = socios.filter(
    (s) =>
      s.name.toLowerCase().includes(filtro.toLowerCase()) ||
      s.rut.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="p-6 min-h-screen bg-gray-100 text-gray-800">
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-blue-700">📚 Gestión de Socios</h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
          + Agregar Socio
        </button>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow text-center">
          <h3 className="text-sm text-gray-500">Total de Socios</h3>
          <p className="text-2xl font-bold text-blue-700">{socios.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow text-center">
          <h3 className="text-sm text-gray-500">Postulantes Pendientes</h3>
          <p className="text-2xl font-bold text-yellow-600">{postulantes.length}</p>
        </div>
      </div>

      {/* Buscador */}
      <input
        type="text"
        placeholder="🔍 Buscar socio por nombre o RUT..."
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
        className="w-full p-2 mb-6 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* Contenedor principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel de Socios */}
        <div className="lg:col-span-2 bg-white p-4 rounded-xl shadow">
          <h2 className="text-lg font-semibold mb-3 text-blue-600">Socios Registrados</h2>
          <div className="overflow-y-auto max-h-[400px] scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-gray-100 smooth-scroll">
            <table className="min-w-full text-sm text-left border-collapse">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="py-2 px-3 border-b">Nombre</th>
                  <th className="py-2 px-3 border-b">RUT</th>
                  <th className="py-2 px-3 border-b">Email</th>
                  <th className="py-2 px-3 border-b">Teléfono</th>
                </tr>
              </thead>
              <tbody>
                {sociosFiltrados.length > 0 ? (
                  sociosFiltrados.map((socio) => (
                    <tr key={socio.id} className="hover:bg-gray-50">
                      <td className="py-2 px-3 border-b">{socio.name}</td>
                      <td className="py-2 px-3 border-b">{socio.rut}</td>
                      <td className="py-2 px-3 border-b">{socio.email}</td>
                      <td className="py-2 px-3 border-b">{socio.telefono}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-4 text-center text-gray-400">
                      No hay socios que coincidan con la búsqueda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel de Postulantes */}
        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="text-lg font-semibold mb-3 text-yellow-600">Postulantes</h2>
          <div className="overflow-y-auto max-h-[400px] scrollbar-thin scrollbar-thumb-yellow-400 scrollbar-track-gray-100 smooth-scroll">
            {postulantes.length > 0 ? (
              postulantes.map((p) => (
                <div
                  key={p.id}
                  className="p-3 border-b hover:bg-gray-50 rounded cursor-pointer"
                  onClick={() => setPostulanteSeleccionado(p)}
                >
                  <p className="font-semibold">{p.name} {p.lastname}</p>
                  <p className="text-sm text-gray-600">{p.rut}</p>
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        aceptarPostulante(p);
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-sm rounded"
                    >
                      Aceptar
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-4">No hay postulantes pendientes.</p>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Detalles del Postulante */}
      {postulanteSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white rounded-xl shadow-lg w-[90%] md:w-[500px] p-6 relative">
            <button
              onClick={() => setPostulanteSeleccionado(null)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl"
            >
              ✕
            </button>
            <h3 className="text-xl font-semibold mb-4 text-yellow-700">Detalles del Postulante</h3>
            <div className="space-y-2 text-gray-700">
              <p><b>Nombre:</b> {postulanteSeleccionado.name} {postulanteSeleccionado.lastname}</p>
              <p><b>RUT:</b> {postulanteSeleccionado.rut}</p>
              <p><b>Fecha de nacimiento:</b> {postulanteSeleccionado.birthdate}</p>
              <p><b>Dirección:</b> {postulanteSeleccionado.street} #{postulanteSeleccionado.number}</p>
              <p><b>Email:</b> {postulanteSeleccionado.email}</p>
              <p><b>Teléfono:</b> {postulanteSeleccionado.phone}</p>
            </div>
            <div className="mt-6 text-right">
              <button
                onClick={() => {
                  aceptarPostulante(postulanteSeleccionado);
                  setPostulanteSeleccionado(null);
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
              >
                Aceptar Postulante
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


