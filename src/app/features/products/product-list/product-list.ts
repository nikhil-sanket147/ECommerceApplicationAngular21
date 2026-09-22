import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService, CreateCategoryRequest } from '../product.service';
import { AuthService } from '../../auth/auth.service';
import { Product, Category, CreateProductRequest } from '../../../core/models/product.model';
import { CartService } from '../../cart/cart.service';

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
  private cartService = inject(CartService);

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  viewMode = signal<'grid' | 'table'>('grid');

  // Search, Filter & Sort
  searchQuery = signal<string>('');
  selectedCategoryId = signal<string>('ALL');
  sortColumn = signal<SortColumn>('name');
  sortDirection = signal<SortDirection>('asc');

  // Pagination
  currentPage = signal<number>(1);
  pageSize = signal<number>(8);
  pageSizeOptions = [8, 12, 24];

  // User Role Guard
  isAdmin = computed(() => this.authService.currentUser()?.role?.toLowerCase() === 'admin');

  // Summary Metrics
  totalProductsCount = computed(() => this.products().length);
  inStockCount = computed(() => this.products().filter(p => (p.stockQuantity || 0) > 0).length);
  outOrLowStockCount = computed(() => this.products().filter(p => (p.stockQuantity || 0) < 5).length);
  totalCategoriesCount = computed(() => this.categories().length);

  // Modals State
  productToEdit = signal<Product | null>(null);
  productToDelete = signal<Product | null>(null);
  isCreateModalOpen = signal<boolean>(false);

  // Category Modal State
  isCategoryModalOpen = signal<boolean>(false);
  editingCategory = signal<Category | null>(null);
  categoryForm = signal<CreateCategoryRequest>({ name: '', description: '' });

  // Quick Stock Modal State
  stockModalProduct = signal<Product | null>(null);
  newStockValue = signal<number>(0);

  isSubmitting = signal<boolean>(false);

  productForm = signal<CreateProductRequest>({
    name: '',
    description: '',
    price: 0,
    stockQuantity: 0,
    categoryId: ''
  });

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

  // --- Product CRUD Actions ---
  openCreateModal(): void {
    if (!this.isAdmin()) return;
    this.productForm.set({
      name: '',
      description: '',
      price: 0,
      stockQuantity: 1,
      categoryId: this.categories()[0]?.id || ''
    });
    this.isCreateModalOpen.set(true);
  }

  openEditModal(product: Product): void {
    if (!this.isAdmin()) return;
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
    if (!this.isAdmin()) return;
    this.productToDelete.set(product);
  }

  closeModals(): void {
    if (!this.isSubmitting()) {
      this.isCreateModalOpen.set(false);
      this.productToEdit.set(null);
      this.productToDelete.set(null);
      this.isCategoryModalOpen.set(false);
      this.editingCategory.set(null);
      this.stockModalProduct.set(null);
    }
  }

  saveProduct(): void {
    if (!this.isAdmin()) return;

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
    if (!this.isAdmin()) return;
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

  // --- Quick Stock Update ---
  openStockModal(product: Product): void {
    if (!this.isAdmin()) return;
    this.stockModalProduct.set(product);
    this.newStockValue.set(product.stockQuantity || 0);
  }

saveQuickStock(): void {
  const prod = this.stockModalProduct();
  if (!prod) return;

  this.isSubmitting.set(true);
  this.productService.updateStock(prod.id, this.newStockValue()).subscribe({
    next: () => {
      this.isSubmitting.set(false);
      this.closeModals();
      this.loadData();
      this.showToast(`Stock updated for ${prod.name}.`);
    },
    error: () => {
      this.isSubmitting.set(false);
      this.errorMessage.set('Failed to update stock quantity.');
    }
  });
}

  // --- Category Actions ---
  openCategoryModal(): void {
    if (!this.isAdmin()) return;
    this.categoryForm.set({ name: '', description: '' });
    this.editingCategory.set(null);
    this.isCategoryModalOpen.set(true);
  }

  startEditCategory(cat: Category): void {
    this.editingCategory.set(cat);
    this.categoryForm.set({
      name: cat.name,
      description: cat.description || ''
    });
  }

  cancelEditCategory(): void {
    this.editingCategory.set(null);
    this.categoryForm.set({ name: '', description: '' });
  }

  saveCategory(): void {
    if (!this.isAdmin()) return;
    const form = this.categoryForm();
    if (!form.name.trim()) return;

    this.isSubmitting.set(true);
    const editCat = this.editingCategory();

    const action$ = editCat
      ? this.productService.updateCategory(editCat.id, form)
      : this.productService.createCategory(form);

    action$.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.cancelEditCategory();
        this.productService.getCategories().subscribe(cats => this.categories.set(cats));
        this.showToast(editCat ? 'Category updated successfully.' : 'Category created successfully.');
      },
      error: () => {
        this.isSubmitting.set(false);
        this.errorMessage.set('Failed to save category.');
      }
    });
  }

  deleteCategory(cat: Category): void {
    if (!this.isAdmin()) return;
    if (!confirm(`Are you sure you want to delete category "${cat.name}"?`)) return;

    this.productService.deleteCategory(cat.id).subscribe({
      next: () => {
        this.productService.getCategories().subscribe(cats => this.categories.set(cats));
        this.showToast('Category deleted successfully.');
      },
      error: () => this.errorMessage.set('Failed to delete category.')
    });
  }

addToCart(product: Product): void {
  if ((product.stockQuantity || 0) <= 0) return;

  this.cartService.addItem({
    productId: product.id,
    productName: product.name,
    unitPrice: product.price,
    quantity: 1,
    imageUrl: product.imageUrl  || ""
  }).subscribe({
    next: () => {
      this.showToast(`Added "${product.name}" to cart!`);
      this.cartService.openDrawer(); // Automatically slides the drawer open
    },
    error: () => this.errorMessage.set('Failed to add item to cart.')
  });
}

  private showToast(msg: string): void {
    this.successMessage.set(msg);
    setTimeout(() => this.successMessage.set(null), 3000);
  }
}