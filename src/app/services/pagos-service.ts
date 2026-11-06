import { inject, Injectable } from '@angular/core';
import { collectionData, Firestore } from '@angular/fire/firestore';
import { collection } from 'firebase/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PagosService {
  private firestore = inject(Firestore);

  private pagosCollection = collection(this.firestore, 'gastos');
  private categoriaCollection = collection(this.firestore, 'categorias');
  private estadoCollection = collection(this.firestore, 'estados');


  getPagos(): Observable<any[]> {
    return collectionData(this.pagosCollection, { idField: 'id' }) as Observable<any[]>
  }

  getCategorias(): Observable<any[]> {
    return collectionData(this.categoriaCollection, { idField: 'id' }) as Observable<any[]>
  }

  getEstados(): Observable<any[]> {
    return collectionData(this.estadoCollection, { idField: 'id' }) as Observable<any[]>
  }
}
