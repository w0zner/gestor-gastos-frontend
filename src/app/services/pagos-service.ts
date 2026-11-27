import { computed, effect, inject, Injectable, Type } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Auth, user } from '@angular/fire/auth';
import { collectionData, Firestore } from '@angular/fire/firestore';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, serverTimestamp, updateDoc, where, writeBatch } from 'firebase/firestore';
import { Observable, of, switchMap } from 'rxjs';
import { ToastService } from './toast-service';
import { buildResponse, OperationResponse, TypeResponse } from '../interfaces/operation-response';

@Injectable({
  providedIn: 'root',
})
export class PagosService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  toastService = inject(ToastService);

  private readonly coleccion_local = 'gastos';
  private readonly coleccion_foranea = 'plantillas';

  //user$ = user(this.auth);
  usuario = toSignal(user(this.auth), { initialValue: null });

  private pagosCollection = collection(this.firestore, this.coleccion_local);
  private categoriaCollection = collection(this.firestore, 'categorias');
  private estadoCollection = collection(this.firestore, 'estados');

  //estados = toSignal(this.getEstados(), { initialValue: [] });

  /* constructor() {
    effect(() => {
      console.log('Usuario actual:', this.usuario()?.uid);
    });
  } */

  getPagosDelUsuario(mes: number, anho: number): Observable<any[]> {
    //const estPendiente = this.estados().find(e => e.nombre === 'Sin empezar');

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

  // getPagos(): Observable<any[]> {
  //   let usuario = 0
  //   return collectionData(query(this.pagosCollection, where('user_id', '==', usuario)), { idField: 'id' }) as Observable<any[]>
  // }

  getCategorias(): Observable<any[]> {
    return collectionData(this.categoriaCollection, { idField: 'id' }) as Observable<any[]>
  }

  getEstados(): Observable<any[]> {
    return collectionData(this.estadoCollection, { idField: 'id' }) as Observable<any[]>
  }

  async actualizarEstadoPago(pagoId: string, nuevoEstadoId: string): Promise<void> {
    const pagoRef = doc(this.firestore, `users/${this.usuario()?.uid}/gastos/${pagoId}`);

    const estadoRef = doc(this.firestore, `estados/${nuevoEstadoId}`);

    await updateDoc(pagoRef, {
      estado: estadoRef
    });
  }



  async createDoc(payload: any, target: string): Promise<OperationResponse> {
    const templatesRef = collection(this.firestore, `users/${this.usuario()?.uid}/${target}`);
    const estadoRef = doc(this.firestore, `estados/${payload.estado}`);
    const categoriaRef = doc(this.firestore, `categorias/${payload.categoria}`);

    const docu = await addDoc(templatesRef, {
      ...payload,
      estado: estadoRef,
      categoria: categoriaRef,
      fecha_creacion: serverTimestamp()
    });

    return buildResponse(TypeResponse.OK, `Registro guardado con éxito.`, docu);
  }

  async updateDoc(id: string, payload: any, target: string): Promise<OperationResponse> {
    const ref = doc(this.firestore, `users/${this.usuario()?.uid}/${target}/${id}`);
    const estadoRef = doc(this.firestore, `estados/${payload.estado}`);
    const categoriaRef = doc(this.firestore, `categorias/${payload.categoria}`);

    const docu = await updateDoc(ref, {
      ...payload,
      estado: estadoRef,
      categoria: categoriaRef
    });

    return buildResponse(TypeResponse.OK, `Registro actualizado con éxito.`, docu);
  }


  async inicializarMesGastos(): Promise<OperationResponse> {
    const mesActual = new Date().getMonth() + 1;
    const anhoActual = new Date().getFullYear();
    const expensesRef = collection(this.firestore, `users/${this.usuario()?.uid}/gastos`);

    // 1. Verificar si ya existen gastos fijos generados para este mes (ej. "2026-11")
    const q = query(
      expensesRef,
      where('mes', '==', mesActual),
      where('esFijo', '==', true)
    );
    const existingSnap = await getDocs(q);

    if (!existingSnap.empty) {
      return buildResponse(TypeResponse.ERROR, 'Los gastos fijos ya fueron inicializados este mes.');
    }

    // 2. Obtener las plantillas activas
    const templatesRef = collection(this.firestore, `users/${this.usuario()?.uid}/plantillas`);
    const templatesSnap = await getDocs(query(templatesRef, where('activo', '==', true)));

    if (templatesSnap.empty) return buildResponse(TypeResponse.WARNING, 'No hay plantillas activas para inicializar.');

    // 3. Crear las instancias usando un batch para eficiencia atómica
    const batch = writeBatch(this.firestore);

    templatesSnap.forEach(templateDoc => {
      const template = templateDoc.data();
      const newExpenseRef = doc(collection(this.firestore, `users/${this.usuario()?.uid}/gastos`));

      batch.set(newExpenseRef, {
        ...template,
        mes: mesActual,
        anho: anhoActual,
        esFijo: true,
        fecha_creacion: serverTimestamp()
      });
    });

    await batch.commit();
    return buildResponse(TypeResponse.OK, 'Gastos fijos del mes inicializados con éxito.');
  }

  //Copia Documento exactamente igual
  async copiarDocumento(source: string, target: string, templateId: string, targetMonth: string): Promise<void> {
    try {
      console.log(`Iniciando copia desde ${source} ${templateId} hacia ${target} para el mes ${targetMonth}`);
      // 1. Apuntar y obtener el documento de la plantilla origen
      const templateDocRef = doc(this.firestore, `users/${this.usuario()?.uid}/${source}/${templateId}`);
      const templateSnap = await getDoc(templateDocRef);

      if (!templateSnap.exists()) {
        throw new Error(`La plantilla con ID ${templateId} no existe.`);
      }

      const templateData = templateSnap.data();
      console.log(templateData)

      // 2. Apuntar a la colección de destino (expenses)
      const expensesRef = collection(this.firestore, `users/${this.usuario()?.uid}/${target}`);

      // 4. Guardar como un nuevo documento con ID automático en expenses
      await addDoc(expensesRef, templateData);

      console.log(`Plantilla copiada exitosamente a expenses para el mes ${targetMonth}`);

    } catch (error) {
      console.error('Error al copiar la plantilla:', error);
      throw error;
    }
  }

  async copiarPlantilla(origen: string, destino: string, templateId: string, mes: number, anho: number): Promise<OperationResponse> {
    const targetMonth = `${anho}-${mes}`; // Formato YYYY-MM
    try {
      console.log(`Iniciando copia de plantilla ${templateId} para el mes ${targetMonth} desde ${origen} hacia ${destino}`);
      // 1. Apuntar y obtener el documento de la plantilla origen
      const templateDocRef = doc(this.firestore, `users/${this.usuario()?.uid}/${origen}/${templateId}`);
      const templateSnap = await getDoc(templateDocRef);

      if (!templateSnap.exists()) {
        throw new Error(`La plantilla con ID ${templateId} no existe.`);
      }

      const templateData = templateSnap.data();
      console.log(templateData)

      // 2. Apuntar a la colección de destino (expenses)
      const documentRef = collection(this.firestore, `users/${this.usuario()?.uid}/${destino}`);

      // 3. Construir el nuevo objeto combinando los datos de la plantilla y los propios del gasto mensual
      const newExpensePayload = {
        ...templateData,
        mes: mes,
        anho: anho,
        esFijo: true,
        fecha_creacion: serverTimestamp()
      };

      // 4. Guardar como un nuevo documento con ID automático en expenses
      await addDoc(documentRef, newExpensePayload);

      const mensaje = `Plantilla copiada exitosamente de ${origen} a ${destino} para el mes ${targetMonth}`
      console.log(mensaje);
      return buildResponse(TypeResponse.OK, mensaje)

    } catch (error) {
      console.error('Error al copiar la plantilla:', error);
      throw error;
    }
  }

  async deleteDoc(target: string, id: string | undefined): Promise<OperationResponse> {

    if (!id) {
      throw new Error('Se requiere un ID válido para eliminar la plantilla.');
    }

    const docRef = doc(this.firestore, `users/${this.usuario()?.uid}/${target}/${id}`);
    await deleteDoc(docRef);

    return buildResponse(TypeResponse.OK, `Plantilla con ID ${id} eliminada con éxito.`);
  }
}

