import { Component, inject, signal } from '@angular/core';
import { SidebarService } from '../../services/sidebar-service';
import { toSignal } from '@angular/core/rxjs-interop';
import { Auth, user } from '@angular/fire/auth';
import { GenericService } from '../../services/generic-service';
import { CategoriasFormComponent } from '../categorias-form-component/categorias-form-component';

@Component({
  selector: 'app-categorias-list-component',
  imports: [CategoriasFormComponent],
  templateUrl: './categorias-list-component.html',
  styleUrl: './categorias-list-component.css',
})
export class CategoriasListComponent {
  sidebarService = inject(SidebarService);
  private auth = inject(Auth);
  private genericService = inject(GenericService)

  private readonly coleccion_local = 'categorias';

  usuario = toSignal(user(this.auth), { initialValue: null });

  isModalOpen = signal(false);
  selectedItem = signal<any | null>(null);

  categorias = toSignal(this.genericService.obtenerColeccionSimple(this.coleccion_local), { initialValue: [] });

  openCreateModal() {
    this.selectedItem.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(item: any) {
    this.selectedItem.set(item);
    this.isModalOpen.set(true);
  }

  closeModal() {
    console.log('Cerrando modal...');
    this.isModalOpen.set(false);
    this.selectedItem.set(null);
  }

  async manejoGuardado(event: { id?: string; payload: Omit<any, 'id'> }) {
    if (event.id) {
      console.log('Guardando cambios en el pago con ID:', event.id, 'con datos:', event.payload);
      await this.genericService.updateDoc(this.coleccion_local, event.id, event.payload);
    } else {
      console.log('Creando nuevo pago con datos:', event.payload);
      await this.genericService.createDoc(this.coleccion_local, event.payload);
    }
    this.closeModal();
  }

  copiar(item: any) {
    this.genericService.copiarDocumento(this.coleccion_local, this.coleccion_local, item.id)
      .then(() => {
        console.log("Copia realizada")
      })
      .catch((error) => {
        console.error("Error ", error)
      })
  }

  eliminar(item: any) {
    if (!item.id) {
      console.error('No se puede eliminar la plantilla: ID no definido.');
      return;
    }

    this.genericService.deleteDoc(this.coleccion_local, item.id)
      .then(() => {
        console.log(`El registro con ID ${item.id} eliminada con éxito.`);
      })
      .catch((error) => {
        console.error('Error al eliminar la plantilla:', error);
      });
  }

}
