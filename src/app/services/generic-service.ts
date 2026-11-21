import { inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Auth, user } from '@angular/fire/auth';
import { Firestore, collectionData } from '@angular/fire/firestore';
import { addDoc, collection, deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GenericService {
  private firestore = inject(Firestore)
  private auth = inject(Auth);

  usuario = toSignal(user(this.auth), { initialValue: null });

  obtenerColeccionSimple(nameColection: string): Observable<any[]> {
    const objectCollection = collection(this.firestore, nameColection);
    return collectionData(objectCollection, { idField: 'id' }) as Observable<any[]>
  }

  async createDoc(nameColection: string, payload: any): Promise<void> {
    const objectCollection = collection(this.firestore, nameColection);

    await addDoc(objectCollection, payload);
  }

  async updateDoc(nameColection: string, id: string, payload: any): Promise<void> {
    const ref = doc(this.firestore, `${nameColection}/${id}`);
    await updateDoc(ref, payload);
  }

  async deleteDoc(nameColection: string, id: string): Promise<void> {
    console.log('Intentando eliminar registro con ID:', id, ' de la coleccion ', nameColection);
    if (!id) {
      throw new Error('Se requiere un ID válido para eliminar el registro.');
    }

    const docRef = doc(this.firestore, `${nameColection}/${id}`);
    await deleteDoc(docRef);
  }

  async copiarDocumento(sourceCollection: string, targetCollection: string, id: string): Promise<void> {
    try {
      const templateDocRef = doc(this.firestore, `${sourceCollection}/${id}`);
      const templateSnap = await getDoc(templateDocRef);

      if (!templateSnap.exists()) {
        throw new Error(`El registro con ID ${id} no existe.`);
      }

      const templateData = templateSnap.data();
      console.log(templateData)

      const expensesRef = collection(this.firestore, `${targetCollection}`);

      await addDoc(expensesRef, templateData);
      console.log(`Registro copiado exitosamente en la coleccion `, targetCollection);

    } catch (error) {
      console.error('Error al copiar la plantilla:', error);
      throw error;
    }
  }

}
