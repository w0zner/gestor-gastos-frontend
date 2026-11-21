import { inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Auth, user } from '@angular/fire/auth';
import { collectionData, Firestore } from '@angular/fire/firestore';
import { addDoc, collection, orderBy, query, serverTimestamp, where } from 'firebase/firestore';
import { Observable, of, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PlantillasService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  private readonly coleccion_local = 'plantillas';
  private readonly coleccion_foranea = 'gastos';

  usuario = toSignal(user(this.auth), { initialValue: null });

  private plantillasCollection = collection(this.firestore, this.coleccion_local);
  private categoriaCollection = collection(this.firestore, 'categorias');
  private estadoCollection = collection(this.firestore, 'estados');

  obtenerPlantillas(activo: boolean): Observable<any[]> {
    return user(this.auth).pipe(
      switchMap(currentUser => {
        if (!currentUser) return of([]); // Si no hay usuario, lista vacía
        console.log('Usuario actual en getPlantillas():', currentUser.uid);

        const q = query(
          collection(this.firestore, `users/${currentUser.uid}/${this.coleccion_local}`),
          where('activo', '==', activo),
          //where('anho', '==', anho),
          orderBy('dia_vencimiento', 'asc')
        );
        return collectionData(q, { idField: 'id' });
      })
    );
  }

  async crearPlantilla(templateData: { notas: string, estado: string, esFijo: string, concepto: string, anho: number, mes: number, monto_estimado: string, monto_pagado: number, dia_vencimiento: number, fecha_pago: string, categoria: string }) {
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
      fecha_creacion: serverTimestamp()
    });
  }
}
