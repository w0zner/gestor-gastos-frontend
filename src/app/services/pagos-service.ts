import { computed, effect, inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Auth, user } from '@angular/fire/auth';
import { collectionData, Firestore } from '@angular/fire/firestore';
import { collection, doc, orderBy, query, updateDoc, where } from 'firebase/firestore';
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
}
