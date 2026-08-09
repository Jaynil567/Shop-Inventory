from django.urls import path
from .views import (
    LoginView, SignupView, ProfileView,
    ProductListView, ToggleProductView, UpdateProductView, DownloadBarcodeView,
    SaveBillView, GetNextBillNoView, BillsHistoryView, BatchStockIncrementView, GetAllProductsView
)

urlpatterns = [
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/signup/', SignupView.as_view(), name='signup'),
    path('auth/profile/', ProfileView.as_view(), name='profile'),
    path('products/', ProductListView.as_view(), name='product_list'),
    path('products/toggle/', ToggleProductView.as_view(), name='product_toggle'),
    path('products/update/', UpdateProductView.as_view(), name='product_update'),
    path('products/download-barcode/<str:code>/', DownloadBarcodeView.as_view(), name='download_barcode'),
    path('products/get-all/', GetAllProductsView.as_view(), name='get_all_products'),
    path('products/batch-stock-increment/', BatchStockIncrementView.as_view(), name='batch_stock_increment'),
    path('orders/next-bill-no/', GetNextBillNoView.as_view(), name='next_bill_no'),
    path('orders/save-bill/', SaveBillView.as_view(), name='save_bill'),
    path('orders/bills-history/', BillsHistoryView.as_view(), name='bills_history'),
]
