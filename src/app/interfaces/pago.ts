export interface Pago {
    id?: string;
    anho: number;
    mes: number;
    concepto: string;
    monto_estimado: number;
    monto_pagado: number;
    dia_vencimiento: number;
    fecha_pago: any;
    notas: string;
    estado: string;
    categoria: string;
    esFijo: boolean;
    templateId?: string;
    fecha_creacion: string;
    activo: boolean;
}