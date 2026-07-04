"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

type User = {
  id: string;
  nombre: string;
  correo: string;
  rol: "administrador" | "odontologo" | "paciente";
  es_activo: boolean;
};

type FilterRol = "todos" | "administrador" | "odontologo" | "paciente";
type FilterEstado = "todos" | "activo" | "inactivo";

const rolLabel: Record<string, string> = {
  administrador: "Administrador",
  odontologo: "Odontólogo",
  paciente: "Paciente",
};

const rolColor: Record<string, string> = {
  administrador: "bg-[#E8EBF7] text-[#283A97]",
  odontologo: "bg-[#E0F7FA] text-[#00838F]",
  paciente: "bg-[#F3F4F6] text-[#6B7280]",
};

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

const avatarColors = ["bg-[#283A97]", "bg-[#00838F]", "bg-[#E45C3C]", "bg-[#7C3AED]", "bg-[#059669]"];

function getAvatarColor(name: string) {
  return avatarColors[name.charCodeAt(0) % avatarColors.length];
}

const ITEMS_PER_PAGE = 8;

type NewUser = {
  nombre: string;
  correo: string;
  password: string;
  rol: string;
};

type FieldErrors = Record<string, string>;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRol, setFilterRol] = useState<FilterRol>("todos");
  const [filterEstado, setFilterEstado] = useState<FilterEstado>("todos");
  const [page, setPage] = useState(1);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [newCorreo, setNewCorreo] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState<NewUser>({
    nombre: "", correo: "", password: "", rol: "odontologo",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [addError, setAddError] = useState<string | null>(null);
  const [addLoading, setAddLoading] = useState(false);

  const fetchUsers = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("usuario")
      .select("id, nombre, correo, rol, es_activo")
      .order("nombre");
    setUsers(data ?? []);
    setIsLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const filtered = users.filter((u) => {
    const matchSearch =
      u.nombre.toLowerCase().includes(search.toLowerCase()) ||
      u.correo?.toLowerCase().includes(search.toLowerCase());
    const matchRol = filterRol === "todos" || u.rol === filterRol;
    const matchEstado =
      filterEstado === "todos" ||
      (filterEstado === "activo" ? u.es_activo : !u.es_activo);
    return matchSearch && matchRol && matchEstado;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleToggleActive = async (user: User) => {
    if (user.es_activo) {
      const adminsActivos = users.filter((u) => u.rol === "administrador" && u.es_activo);
      if (user.rol === "administrador" && adminsActivos.length <= 1) {
        alert("No se puede desactivar el último administrador activo.");
        return;
      }
    }
    const supabase = createClient();
    await supabase.from("usuario").update({ es_activo: !user.es_activo }).eq("id", user.id);
    fetchUsers();
  };

  const handleEditCorreo = async () => {
    if (!editUser) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newCorreo)) {
      setEditError("Ingrese un correo electrónico válido");
      return;
    }
    const exists = users.find((u) => u.correo === newCorreo && u.id !== editUser.id);
    if (exists) {
      setEditError("Este correo ya está asociado a otro usuario.");
      return;
    }
setEditLoading(true);
const supabase = createClient();
await supabase.from("usuario").update({ correo: newCorreo }).eq("id", editUser.id);
setShowEditModal(false);
setEditUser(null);
setEditError(null);
fetchUsers();
setEditLoading(false);



await supabase.from("usuario").update({ correo: newCorreo }).eq("id", editUser.id);
    setShowEditModal(false);
    setEditUser(null);
    setEditError(null);
    fetchUsers();
    setEditLoading(false);
  };

  const validateNewUser = (): FieldErrors => {
    const errors: FieldErrors = {};
    const u = newUser;
    if (!u.nombre.trim()) errors.nombre = "El nombre es requerido";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u.correo)) errors.correo = "Ingrese un correo válido";
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(u.password))
      errors.password = "Mínimo 8 caracteres, una mayúscula, una minúscula y un número";
    if (!u.rol) errors.rol = "El rol es requerido";
    return errors;
  };

  const handleAddUser = async () => {
    const errors = validateNewUser();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setAddLoading(true);
    setAddError(null);

    const response = await fetch("/api/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });

    const data = await response.json();
    if (!response.ok) {
      setAddError(data.error ?? "Ocurrió un error al crear el usuario");
      setAddLoading(false);
      return;
    }

    setShowAddModal(false);
    setNewUser({ nombre: "", correo: "", password: "", rol: "odontologo" });
    fetchUsers();
    setAddLoading(false);
  };

  const inputClass = "rounded-lg border border-[#D7DEF2] bg-white px-4 py-2.5 text-sm text-[#1F2937] placeholder:text-[#9CA3AF] focus:border-[#00C2F3] focus:outline-none focus:ring-2 focus:ring-[#00C2F3]/30 w-full";
  const inputErrorClass = "rounded-lg border border-[#E45C3C] bg-white px-4 py-2.5 text-sm text-[#1F2937] placeholder:text-[#9CA3AF] focus:outline-none w-full";
  const errorText = "text-xs text-[#E45C3C] mt-0.5";
  const labelClass = "text-sm font-medium text-[#283A97]";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#283A97]">Usuarios</h1>
          <p className="mt-1 text-sm text-[#6B7280]">Gestión de usuarios internos del sistema.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-lg bg-[#283A97] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1F2D75] transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
          </svg>
          Registrar usuario
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total usuarios", value: users.length },
          { label: "Usuarios activos", value: users.filter((u) => u.es_activo).length },
          { label: "Usuarios inactivos", value: users.filter((u) => !u.es_activo).length },
        ].map((m) => (
          <div key={m.label} className="bg-white rounded-xl border border-[#E2E6F0] px-5 py-4">
            <p className="text-xs text-[#6B7280] uppercase tracking-wide">{m.label}</p>
            <p className="text-2xl font-semibold text-[#283A97] mt-1">{m.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <input
          type="text"
          placeholder="Buscar por nombre o correo..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="rounded-lg border border-[#D7DEF2] bg-white px-4 py-2 text-sm text-[#1F2937] placeholder:text-[#9CA3AF] focus:border-[#00C2F3] focus:outline-none focus:ring-2 focus:ring-[#00C2F3]/30 w-72"
        />
        <select
          value={filterRol}
          onChange={(e) => { setFilterRol(e.target.value as FilterRol); setPage(1); }}
          className="rounded-lg border border-[#D7DEF2] bg-white px-4 py-2 text-sm text-[#1F2937] focus:border-[#00C2F3] focus:outline-none"
        >
          <option value="todos">Todos los roles</option>
          <option value="administrador">Administrador</option>
          <option value="odontologo">Odontólogo</option>
          <option value="paciente">Paciente</option>
        </select>
        <select
          value={filterEstado}
          onChange={(e) => { setFilterEstado(e.target.value as FilterEstado); setPage(1); }}
          className="rounded-lg border border-[#D7DEF2] bg-white px-4 py-2 text-sm text-[#1F2937] focus:border-[#00C2F3] focus:outline-none"
        >
          <option value="todos">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-[#E2E6F0] overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-[#6B7280]">Cargando usuarios...</p>
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-[#6B7280]">No se encontraron usuarios con los filtros aplicados.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E2E6F0] bg-[#F4F5F8]">
                {["Nombre", "Correo", "Rol", "Estado", "Acciones"].map((h) => (
                  <th key={h} className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wide px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((user) => (
                <tr key={user.id} className="border-b border-[#F1F4FA] hover:bg-[#FAFBFF] transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0 ${getAvatarColor(user.nombre)}`}>
                        {getInitials(user.nombre)}
                      </div>
                      <span className="text-sm font-medium text-[#1F2937]">{user.nombre}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-[#6B7280]">{user.correo ?? "—"}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${rolColor[user.rol]}`}>
                      {rolLabel[user.rol]}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${user.es_activo ? "bg-[#ECFDF5] text-[#059669]" : "bg-[#FEF2F2] text-[#DC2626]"}`}>
                      {user.es_activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setEditUser(user); setNewCorreo(user.correo ?? ""); setShowEditModal(true); }}
                        title="Editar correo"
                        className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#283A97] hover:bg-[#E8EBF7] transition-colors"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleToggleActive(user)}
                        title={user.es_activo ? "Desactivar" : "Activar"}
                        className={`p-1.5 rounded-lg transition-colors ${user.es_activo ? "text-[#DC2626] hover:bg-[#FEF2F2]" : "text-[#059669] hover:bg-[#ECFDF5]"}`}
                      >
                        {user.es_activo ? (
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                          </svg>
                        ) : (
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" /><polyline points="9 12 11 14 15 10" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[#E2E6F0]">
            <p className="text-xs text-[#6B7280]">
              Mostrando {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} de {filtered.length} usuarios
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg text-[#6B7280] hover:bg-[#F4F5F8] disabled:opacity-40">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)} className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${page === p ? "bg-[#283A97] text-white" : "text-[#6B7280] hover:bg-[#F4F5F8]"}`}>{p}</button>
              ))}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg text-[#6B7280] hover:bg-[#F4F5F8] disabled:opacity-40">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {showEditModal && editUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
            <h2 className="text-lg font-semibold text-[#283A97] mb-1">Editar correo</h2>
            <p className="text-sm text-[#6B7280] mb-6">Modificando el correo de <strong>{editUser.nombre}</strong></p>
            <div className="flex flex-col gap-1.5 mb-4">
              <label className={labelClass}>Nuevo correo electrónico</label>
              <input type="email" value={newCorreo} onChange={(e) => setNewCorreo(e.target.value)} className={inputClass} />
            </div>
            {editError && <p className="text-sm text-[#E45C3C] mb-3">{editError}</p>}
            <div className="flex gap-3">
              <button onClick={() => { setShowEditModal(false); setEditUser(null); setEditError(null); }} className="flex-1 rounded-lg border border-[#D7DEF2] px-4 py-2.5 text-sm text-[#6B7280] hover:bg-[#F4F5F8] transition-colors">Cancelar</button>
              <button onClick={handleEditCorreo} disabled={editLoading} className="flex-1 rounded-lg bg-[#283A97] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1F2D75] disabled:opacity-60 transition-colors">
                {editLoading ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
            <h2 className="text-lg font-semibold text-[#283A97] mb-1">Registrar usuario interno</h2>
            <p className="text-sm text-[#6B7280] mb-6">Complete los datos del nuevo administrador u odontólogo.</p>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Nombre completo</label>
                <input type="text" placeholder="Ej: Juan Pérez" value={newUser.nombre} onChange={(e) => setNewUser({ ...newUser, nombre: e.target.value })} className={fieldErrors.nombre ? inputErrorClass : inputClass} />
                {fieldErrors.nombre && <p className={errorText}>{fieldErrors.nombre}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Correo electrónico</label>
                <input type="email" placeholder="correo@ejemplo.com" value={newUser.correo} onChange={(e) => setNewUser({ ...newUser, correo: e.target.value })} className={fieldErrors.correo ? inputErrorClass : inputClass} />
                {fieldErrors.correo && <p className={errorText}>{fieldErrors.correo}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Contraseña temporal</label>
                <input type="password" placeholder="Mínimo 8 caracteres" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} className={fieldErrors.password ? inputErrorClass : inputClass} />
                {fieldErrors.password && <p className={errorText}>{fieldErrors.password}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Rol</label>
                <select value={newUser.rol} onChange={(e) => setNewUser({ ...newUser, rol: e.target.value })} className={inputClass}>
                  <option value="odontologo">Odontólogo</option>
                  <option value="administrador">Administrador</option>
                </select>
              </div>
            </div>
            {addError && <p className="text-sm text-[#E45C3C] mt-3">{addError}</p>}
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowAddModal(false); setAddError(null); setFieldErrors({}); setNewUser({ nombre: "", correo: "", password: "", rol: "odontologo" }); }} className="flex-1 rounded-lg border border-[#D7DEF2] px-4 py-2.5 text-sm text-[#6B7280] hover:bg-[#F4F5F8] transition-colors">Cancelar</button>
              <button onClick={handleAddUser} disabled={addLoading} className="flex-1 rounded-lg bg-[#283A97] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1F2D75] disabled:opacity-60 transition-colors">
                {addLoading ? "Registrando..." : "Registrar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}