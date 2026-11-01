"use client";
import { createContext, useContext } from "react";
import { REAL_ADMIN, type AdminBase } from "./admin-base";

const Ctx = createContext<AdminBase>(REAL_ADMIN);
export const AdminProvider = ({ base, children }: { base: AdminBase; children: React.ReactNode }) => <Ctx.Provider value={base}>{children}</Ctx.Provider>;
export const useAdminBase = () => useContext(Ctx);
