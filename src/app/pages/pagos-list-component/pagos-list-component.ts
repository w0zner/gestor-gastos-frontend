import { Component, computed, effect, inject, output, signal } from '@angular/core';
import { PagosService } from '../../services/pagos-service';
import { Auth, user } from '@angular/fire/auth';
import { Router, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { collection, Firestore } from 'firebase/firestore';
import { collectionData } from '@angular/fire/firestore';
import { forkJoin } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { SidebarService } from '../../services/sidebar-service';
import { ToastService } from '../../services/toast-service';
import { Pago } from '../../interfaces/pago';
import { TypeResponse } from '../../interfaces/operation-response';

@Component({
  selector: 'app-pagos-list-component',
  templateUrl: './pagos-list-component.html',
  styleUrl: './pagos-list-component.css',
  imports: [CurrencyPipe]
})
export class PagosListComponent {
  private pagosService = inject(PagosService);
  private router = inject(Router);
  private auth = inject(Auth);
  sidebarService = inject(SidebarService);
  toastService = inject(ToastService);

  private readonly coleccion_local = 'gastos';
  private readonly coleccion_foranea = 'plantillas';

  usuario = toSignal(user(this.auth), { initialValue: null });

  mesActual = new Date().getMonth() + 1;
  anhoActual = new Date().getFullYear();

  //categoriasMap: { [key: string]: any } = {};
  //estadosMap: { [key: string]: any } = {};

  listaPagos = signal<Pago[]>([]);
  cantidadPagos = signal(0);

  pagosRaw = toSignal(this.pagosService.getPagosDelUsuario(this.mesActual, this.anhoActual), { initialValue: [] });
  categorias = toSignal(this.pagosService.getCategorias(), { initialValue: [] });
  estados = toSignal(this.pagosService.getEstados(), { initialValue: [] });

  pagos = computed(() => {
    const listaPagos = this.pagosRaw();
    const listaCategorias = this.categorias();
    const listaEstados = this.estados();

    if (!listaPagos.length) return [];

    return listaPagos.map((item: any) => {
      const estadoId = item.estado?.id;
      const categoriaId = item.categoria?.id;
      const catMatch = listaCategorias.find(c => c.id === categoriaId);
      const estMatch = listaEstados.find(e => e.id === estadoId);

      return {
        ...item,
        nombreCategoria: catMatch ? catMatch.nombre : 'Sin categoría',
        colorCategoria: catMatch ? catMatch.color : '#000000',

        nombreEstado: estMatch ? estMatch.nombre : 'Sin estado',
        colorEstado: estMatch ? estMatch.color : '#000000'
      };
    })
      .sort((a, b) => {
        // 1. Si uno es "Sin empezar" y el otro no, priorizamos "Sin empezar"
        const aEsSinEmpezar = a.nombreEstado === 'Sin empezar';
        const bEsSinEmpezar = b.nombreEstado === 'Sin empezar';

        if (aEsSinEmpezar && !bEsSinEmpezar) return -1;
        if (!aEsSinEmpezar && bEsSinEmpezar) return 1;

        // 2. Si ambos son "Sin empezar" (o ambos son de otro estado),
        // ordenamos por día de vencimiento ascendente (1 al 31)
        return (a.dia_vencimiento ?? 0) - (b.dia_vencimiento ?? 0);
      });
  });

  conteoPorEstado = computed(() => {
    const listaPagos = this.pagos();
    const listaEstados = this.estados();

    if (!listaEstados.length) return [];

    return listaEstados
      .map((estado: any) => {
        const cantidad = listaPagos.filter(p => p.nombreEstado === estado.nombre || p.estado?.id === estado.id).length;
        return {
          id: estado.id,
          nombre: estado.nombre,
          color: estado.color,
          cantidad
        };
      })
      .sort((a, b) => {
        if (a.nombre === 'Sin empezar') return -1;
        if (b.nombre === 'Sin empezar') return 1;
        return a.nombre.localeCompare(b.nombre);
      });
  });


  constructor() {
    effect(() => {
      // Esto se disparará dos veces: primero con [] y luego con los datos reales cuando lleguen de Firebase
      //console.log('Datos actuales de la señal pagos():', this.pagosRaw());
      //console.log('Datos actuales de la señal categorias():', this.categorias());
      //console.log('Datos actuales de la señal estados():', this.estados());

      //effect(() => {
      console.log('Usuario actual:', this.usuario()?.uid);
      //});
    });
  }

  async cambiarEstado(pagoId: string, event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const nuevoEstadoId = selectElement.value;

    try {
      await this.pagosService.actualizarEstadoPago(pagoId, nuevoEstadoId);
    } catch (error) {
      console.error('Error al actualizar el estado:', error);
      this.toastService.error('Error al actualizar el estado: ' + error);
    }
  }

  inicializarMesGastos() {
    this.pagosService.inicializarMesGastos()
      .then((response) => {
        this.toastService.showFromResponse(response);
      })
      .catch((error) => {
        console.error('Error al copiar la plantilla:', error);
        this.toastService.notify(TypeResponse.ERROR, 'Error al eliminar la plantilla ' + error);
        this.toastService.error('Error al copiar la plantilla:' + error);
      });
  }

  eliminar(pago: Pago) {
    this.pagosService.deleteDoc(this.coleccion_local, pago.id)
      .then((response) => {
        this.toastService.showFromResponse(response);
      })
      .catch((error) => {
        this.toastService.error('Error al eliminar el pago ' + error);
        console.error('Error al eliminar la plantilla:', error);
      });
  }

}
