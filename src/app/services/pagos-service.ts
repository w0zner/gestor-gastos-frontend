import { computed, effect, inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Auth, user } from '@angular/fire/auth';
import { collectionData, Firestore } from '@angular/fire/firestore';
import { addDoc, collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, updateDoc, where, writeBatch } from 'firebase/firestore';
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
      createdAt: new Date()
    });
  }


/* async initializeMonthlyExpenses(targetMonth: string) {
  const expensesRef = collection(this.firestore, `users/${this.usuario()?.uid}/gastos`);

  // 1. Verificar si ya existen gastos fijos generados para este mes (ej. "2026-11")
  const q = query(
    expensesRef,
    where('mes', '==', targetMonth),
    where('esFijo', '==', true)
  );
  const existingSnap = await getDocs(q);

  if (!existingSnap.empty) {
    console.log('Los gastos fijos de este mes ya fueron inicializados.');
    return;
  }

  // 2. Obtener las plantillas activas
  const templatesRef = collection(this.firestore, `users/${this.usuario()?.uid}/plantillas`);
  const templatesSnap = await getDocs(query(templatesRef, where('activo', '==', true)));

  if (templatesSnap.empty) return;

  // 3. Crear las instancias usando un batch para eficiencia atómica
  const batch = writeBatch(this.firestore);

  templatesSnap.forEach(templateDoc => {
    const template = templateDoc.data();
    const newExpenseRef = doc(collection(this.firestore, `users/${this.usuario()?.uid}/gastos`));

    batch.set(newExpenseRef, {
      month: targetMonth,
      title: template.title,
      amount: template.amount,
      category: template.category,
      isFixed: true,
      status: 'sin_empezar',
      templateId: templateDoc.id
    });
  });

  await batch.commit();
  console.log('Gastos fijos del mes inicializados con éxito.');
} */

async copiarPlantilla(templateId: string, targetMonth: string): Promise<void> {
    try {
      console.log(`Iniciando copia de plantilla ${templateId} para el mes ${targetMonth}`);
      // 1. Apuntar y obtener el documento de la plantilla origen
      const templateDocRef = doc(this.firestore, `users/${this.usuario()?.uid}/gastos/${templateId}`);
      const templateSnap = await getDoc(templateDocRef);

      if (!templateSnap.exists()) {
        throw new Error(`La plantilla con ID ${templateId} no existe.`);
      }

      const templateData = templateSnap.data();

      // 2. Apuntar a la colección de destino (expenses)
      const expensesRef = collection(this.firestore, `users/${this.usuario()?.uid}/plantillas`);

      // 3. Construir el nuevo objeto combinando los datos de la plantilla y los propios del gasto mensual
      const newExpensePayload = {
        month: targetMonth,
        title: templateData['title'],
        amount: templateData['amount'],
        category: templateData['category'],
        isFixed: true,                      // Viene de plantilla, por ende es fijo
        status: 'sin_empezar',              // Estado inicial requerido al inicio de mes
        templateId: templateSnap.id,        // Referencia cruzada a la plantilla original
        createdAt: serverTimestamp()        // Fecha de creación del registro
      };

      // 4. Guardar como un nuevo documento con ID automático en expenses
      await addDoc(expensesRef, newExpensePayload);

      console.log(`Plantilla copiada exitosamente a expenses para el mes ${targetMonth}`);

    } catch (error) {
      console.error('Error al copiar la plantilla:', error);
      throw error;
    }
  }
}

