import { computed, effect, inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Auth, user } from '@angular/fire/auth';
import { collectionData, Firestore } from '@angular/fire/firestore';
import { addDoc, collection, doc, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { Observable, of, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PagosService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  //user$ = user(this.auth);
  usuario = toSignal(user(this.auth), { initialValue: null });

  private pagosCollection = collection(this.firestore, 'gastos');
  private categoriaCollection = collection(this.firestore, 'categorias');
  private estadoCollection = collection(this.firestore, 'estados');

  /* constructor() {
    effect(() => {
      console.log('Usuario actual:', this.usuario()?.uid);
    });
  } */

  getPagosDelUsuario(mes: number, anho: number): Observable<any[]> {
    return user(this.auth).pipe(
      switchMap(currentUser => {
        if (!currentUser) return of([]); // Si no hay usuario, lista vacía
        console.log('Usuario actual en getPagosDelUsuario():', currentUser.uid);

        const q = query(
          collection(this.firestore, `users/${currentUser.uid}/gastos`),
          where('mes', '==', mes),
          where('anho', '==', anho),
          orderBy('dia_vencimiento', 'asc')
        );
        return collectionData(q, { idField: 'id' });
      })
    );
  }

  getPagos(): Observable<any[]> {
    //console.log('Usuario actual:', this.usuario());
    let usuario = 0
    return collectionData(query(this.pagosCollection, where('user_id', '==', usuario)), { idField: 'id' }) as Observable<any[]>
  }

  getCategorias(): Observable<any[]> {
    return collectionData(this.categoriaCollection, { idField: 'id' }) as Observable<any[]>
  }

  getEstados(): Observable<any[]> {
    return collectionData(this.estadoCollection, { idField: 'id' }) as Observable<any[]>
  }

  async actualizarEstadoPago(pagoId: string, nuevoEstadoId: string): Promise<void> {
    const pagoRef = doc(this.firestore, `users/${this.usuario()?.uid}/gastos/${pagoId}`);

    const estadoRef = doc(this.firestore, `estados/${nuevoEstadoId}`);
    //const referenciaEstado = `estados/${nuevoEstadoId}`;

    await updateDoc(pagoRef, {
      estado: estadoRef
    });
  }

  async createRecurringTemplate(templateData: { notas: string, estado: string, esFijo: string, concepto: string, anho: number, mes: number, monto_estimado: string, monto_pagado: number, dia_vencimiento: number, fecha_pago: string, categoria: string }) {
    const templatesRef = collection(this.firestore, `users/${this.usuario()?.uid}/plantillas`);

    await addDoc(templatesRef, {
      anho: templateData.anho,
      mes: templateData.mes,
      concepto: templateData.concepto,
      monto_estimado: templateData.monto_estimado,
      monto_pagado: templateData.monto_pagado,
      dia_vencimiento: templateData.dia_vencimiento,
      fecha_pago: templateData.fecha_pago,
      notas: templateData.notas,
      estado: templateData.estado,
      categoria: templateData.categoria,
      esFijo: templateData.esFijo,
      activo: true,
      createdAt: new Date()
    });
  }
}

