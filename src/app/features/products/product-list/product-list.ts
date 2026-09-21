import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../product.service';
import { AuthService } from '../../auth/auth.service';
import { Product, Category, CreateProductRequest } from '../../../core/models/product.model';

type SortColumn = 'name' | 'price' | 'stock';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css'
})
export class ProductList implements OnInit {
  private productService = inject(ProductService);
  private authService = inject(AuthService);

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  viewMode = signal<'grid' | 'table'>('grid');

  // Search & Filter
  searchQuery = signal<string>('');
  selectedCategoryId = signal<string>('ALL');
  sortColumn = signal<SortColumn>('name');
  sortDirection = signal<SortDirection>('asc');

  // Pagination
  currentPage = signal<number>(1);
  pageSize = signal<number>(8);
  pageSizeOptions = [8, 12, 24];

  // User Role
  isAdmin = computed(() => this.authService.currentUser()?.role?.toLowerCase() === 'admin');

  // Modals State
  productToEdit = signal<Product | null>(null);
  productToDelete = signal<Product | null>(null);
  isCreateModalOpen = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);

  productForm = signal<CreateProductRequest>({
    name: '',
    description: '',
    price: 0,
    stockQuantity: 0,
    categoryId: ''
  });

  // Filtered & Sorted Products
  filteredProducts = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const catId = this.selectedCategoryId();
    const col = this.sortColumn();
    const dir = this.sortDirection();

    let result = this.products().filter((item) => {
      const matchesCategory = catId === 'ALL' || String(item.categoryId) === String(catId);
      const matchesSearch = !q || item.name?.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });

    return [...result].sort((a, b) => {
      let comp = 0;
      if (col === 'name') comp = a.name.localeCompare(b.name);
      if (col === 'price') comp = a.price - b.price;
      if (col === 'stock') comp = (a.stockQuantity || 0) - (b.stockQuantity || 0);
      return dir === 'asc' ? comp : -comp;
    });
  });

  paginatedProducts = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredProducts().slice(start, start + this.pageSize());
  });

  totalPages = computed(() => Math.ceil(this.filteredProducts().length / this.pageSize()) || 1);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.productService.getCategories().subscribe({
      next: (cats) => this.categories.set(cats),
      error: () => {}
    });

    this.productService.getProducts().subscribe({
      next: (prods) => {
        this.products.set(prods);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load products.');
        this.isLoading.set(false);
      }
    });
  }

  toggleSort(column: SortColumn): void {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.selectedCategoryId.set('ALL');
    this.currentPage.set(1);
  }

  // --- CRUD Modals ---
  openCreateModal(): void {
    this.productForm.set({
      name: '',
      description: '',
      price: 0,
      stockQuantity: 10,
      categoryId: this.categories()[0]?.id || ''
    });
    this.isCreateModalOpen.set(true);
  }

  openEditModal(product: Product): void {
    this.productToEdit.set(product);
    this.productForm.set({
      name: product.name,
      description: product.description,
      price: product.price,
      stockQuantity: product.stockQuantity || 0,
      categoryId: product.categoryId || this.categories()[0]?.id || ''
    });
  }

  openDeleteModal(product: Product): void {
    this.productToDelete.set(product);
  }

  closeModals(): void {
    if (!this.isSubmitting()) {
      this.isCreateModalOpen.set(false);
      this.productToEdit.set(null);
      this.productToDelete.set(null);
    }
  }

  saveProduct(): void {
    this.isSubmitting.set(true);
    const form = this.productForm();
    const isEdit = !!this.productToEdit();
    const action$ = isEdit
      ? this.productService.updateProduct(this.productToEdit()!.id, form)
      : this.productService.createProduct(form);

    action$.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeModals();
        this.loadData();
        this.showToast(isEdit ? 'Product updated successfully.' : 'Product created successfully.');
      },
      error: () => {
        this.isSubmitting.set(false);
        this.errorMessage.set('Failed to save product.');
      }
    });
  }

  confirmDelete(): void {
    const prod = this.productToDelete();
    if (!prod) return;

    this.isSubmitting.set(true);
    this.productService.deleteProduct(prod.id).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeModals();
        this.loadData();
        this.showToast('Product deleted successfully.');
      },
      error: () => {
        this.isSubmitting.set(false);
        this.errorMessage.set('Failed to delete product.');
      }
    });
  }

  addToCart(product: Product): void {
    // Hooks into Cart Service
    this.showToast(`Added "${product.name}" to cart!`);
  }

  private showToast(msg: string): void {
    this.successMessage.set(msg);
    setTimeout(() => this.successMessage.set(null), 3000);
  }
}