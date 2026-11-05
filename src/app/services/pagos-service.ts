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

  getPagos(): Observable<any[]> {
    return collectionData(this.pagosCollection, { idField: 'id' }) as Observable<any[]>
  }
}
