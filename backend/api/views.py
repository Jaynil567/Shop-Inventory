from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import User, Product, Bill, BillItem
import jwt
from datetime import datetime
import barcode
from barcode.writer import ImageWriter
from PIL import Image, ImageDraw, ImageFont
import io
import base64
from django.http import HttpResponse, JsonResponse
import os
from django.conf import settings
from django.db import models as dj_models

JWT_SECRET = "inventory"

def get_user_from_request(request):
    auth_header = request.META.get('HTTP_AUTHORIZATION')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    token = auth_header.split(' ')[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        user_id = payload.get('user_id')
        return User.objects.filter(id=user_id).first()
    except Exception as e:
        return None

def get_next_product_code(user_id):
    try:
        products = Product.objects.filter(user_id=user_id)
        last_num = 0
        for p in products:
            if p.code and p.code.startswith('P'):
                try:
                    num = int(p.code[1:])
                    if num > last_num:
                        last_num = num
                except:
                    pass
        num = last_num + 1
        return f"P{num:06d}"
    except Exception as e:
        print("Code Error:", e)
        return "P000001"

def generate_barcode_with_details(code, name, price, shop_name="My Shop"):
    try:
        writer = ImageWriter()
        writer.text = ""

        barcode_class = barcode.get_barcode_class('code128')
        barcode_instance = barcode_class(code, writer=writer)

        buffer = io.BytesIO()
        barcode_instance.write(buffer)
        buffer.seek(0)

        barcode_img = Image.open(buffer)
        barcode_img = barcode_img.resize((400, 120))

        width, barcode_height = barcode_img.size
        total_height = 260

        final_img = Image.new('RGB', (width, total_height), 'white')
        draw = ImageDraw.Draw(final_img)

        try:
            # Look for font relative to project root
            font_path = os.path.join(settings.BASE_DIR, '..', 'static', 'fonts', 'Roboto-Italic-VariableFont_wdth,wght.ttf')
            if not os.path.exists(font_path):
                font_path = os.path.join(settings.BASE_DIR, 'static', 'fonts', 'Roboto-Italic-VariableFont_wdth,wght.ttf')
            font_shop = ImageFont.truetype(font_path, 26)
            font_product = ImageFont.truetype(font_path, 24)
        except Exception as e:
            print("Font load error, using default:", e)
            font_shop = ImageFont.load_default()
            font_product = ImageFont.load_default()

        def center_text(text, y, font):
            text_width = draw.textlength(text, font=font)
            x = (width - text_width) // 2
            draw.text((x, y), text, fill='black', font=font)

        center_text(shop_name, 10, font_shop)
        draw.line((20, 45, width-20, 45), fill="black", width=1)
        center_text(f"{name} | PRICE: ₹{price}", 55, font_product)

        final_img.paste(barcode_img, (0, 100))

        final_buffer = io.BytesIO()
        final_img.save(final_buffer, format="PNG")
        final_buffer.seek(0)

        img_base64 = base64.b64encode(final_buffer.getvalue()).decode()
        return f"data:image/png;base64,{img_base64}"
    except Exception as e:
        print("Barcode Error:", e)
        return ""

class LoginView(APIView):
    def post(self, request):
        mobile = request.data.get('mobile')
        password = request.data.get('password')

        if not mobile or not password:
            return Response({"message": "Mobile and password are required"}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(mobile=mobile, password=password).first()
        if not user:
            return Response({"message": "Wrong Mobile or Password"}, status=status.HTTP_401_UNAUTHORIZED)

        token = jwt.encode({"user_id": user.id}, JWT_SECRET, algorithm="HS256")
        return Response({
            "status": "success",
            "token": token,
            "user": {
                "id": user.id,
                "name": user.name,
                "mobile": user.mobile
            }
        })

class SignupView(APIView):
    def post(self, request):
        name = request.data.get('name')
        mobile = request.data.get('mobile')
        password = request.data.get('password')

        if not name or not mobile or not password:
            return Response({"message": "All fields are required"}, status=status.HTTP_400_BAD_REQUEST)

        existing = User.objects.filter(mobile=mobile).first()
        if existing:
            return Response({"message": "Mobile already registered ❌"}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create(name=name, mobile=mobile, password=password)
        token = jwt.encode({"user_id": user.id}, JWT_SECRET, algorithm="HS256")

        return Response({
            "status": "success",
            "token": token,
            "user": {
                "id": user.id,
                "name": user.name,
                "mobile": user.mobile
            }
        })

class ProfileView(APIView):
    def get(self, request):
        user = get_user_from_request(request)
        if not user:
            return Response({"message": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)
        return Response({
            "status": "success",
            "name": user.name,
            "mobile": user.mobile
        })

class ProductListView(APIView):
    def get(self, request):
        user = get_user_from_request(request)
        if not user:
            return Response({"message": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)
        
        products = Product.objects.filter(user_id=user.id).order_by('code')
        data = []
        for p in products:
            data.append({
                "code": p.code,
                "name": p.name,
                "price": p.price,
                "stock": p.stock,
                "is_active": 1 if p.is_active else 0
            })
        return Response(data)

    def post(self, request):
        user = get_user_from_request(request)
        if not user:
            return Response({"message": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)

        name = request.data.get('name')
        price = float(request.data.get('price', 0))
        stock = int(request.data.get('stock', 0))

        code = get_next_product_code(user.id)
        barcode_data = generate_barcode_with_details(code, name, price, shop_name=user.name)

        Product.objects.create(
            user_id=user.id,
            code=code,
            name=name,
            price=price,
            stock=stock,
            is_active=True
        )

        return Response({
            "status": "success",
            "code": code,
            "barcode": barcode_data
        })

class ToggleProductView(APIView):
    def post(self, request):
        user = get_user_from_request(request)
        if not user:
            return Response({"message": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)

        code = request.data.get('code')
        status_val = request.data.get('status')

        product = Product.objects.filter(user_id=user.id, code=code).first()
        if not product:
            return Response({"message": "Product not found"}, status=status.HTTP_404_NOT_FOUND)

        product.is_active = (status_val == 1)
        product.save()

        return Response({"status": "success"})

class UpdateProductView(APIView):
    def post(self, request):
        user = get_user_from_request(request)
        if not user:
            return Response({"message": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)

        code = request.data.get('code')
        name = request.data.get('name')
        price = float(request.data.get('price', 0))
        stock = int(request.data.get('stock', 0))

        product = Product.objects.filter(user_id=user.id, code=code).first()
        if not product:
            return Response({"message": "Product not found"}, status=status.HTTP_404_NOT_FOUND)

        product.name = name
        product.price = price
        product.stock = stock
        product.save()

        return Response({"status": "success"})

class DownloadBarcodeView(APIView):
    def get(self, request, code):
        user = get_user_from_request(request)
        if not user:
            return Response({"message": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)

        product = Product.objects.filter(user_id=user.id, code=code).first()
        if not product:
            return HttpResponse("Product not found", status=404)

        base64_img = generate_barcode_with_details(code, product.name, product.price, shop_name=user.name)
        if not base64_img:
            return HttpResponse("Error generating barcode", status=500)

        img_data = base64.b64decode(base64_img.split(",")[1])
        response = HttpResponse(img_data, content_type="image/png")
        response['Content-Disposition'] = f'attachment; filename="{code}.png"'
        return response

class SaveBillView(APIView):
    def post(self, request):
        user = get_user_from_request(request)
        if not user:
            return Response({"message": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)

        items = request.data.get('items', [])
        bill_no = request.data.get('bill_no')
        date_now = datetime.now()

        # Insert main Bill record
        Bill.objects.create(
            user_id=user.id,
            bill_no=bill_no,
            date=date_now
        )

        # Insert items and update stock
        for item in items:
            total_val = float(item["price"]) * int(item["count"])
            BillItem.objects.create(
                user_id=user.id,
                bill_no=bill_no,
                code=item["code"],
                name=item["name"],
                price=float(item["price"]),
                qty=int(item["count"]),
                total=total_val,
                datetime=date_now
            )

            # Update stock
            qty_count = int(item["count"])
            stock_change = -qty_count
            Product.objects.filter(user_id=user.id, code=item["code"]).update(
                stock=dj_models.F('stock') + stock_change
            )

        return Response({"status": "success"})

class GetNextBillNoView(APIView):
    def get(self, request):
        user = get_user_from_request(request)
        if not user:
            return Response({"message": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)

        from django.db.models import Max
        last = Bill.objects.filter(user_id=user.id).aggregate(Max('bill_no'))['bill_no__max']
        next_bill = (last + 1) if last else 1001

        return Response({"bill_no": next_bill})

class BillsHistoryView(APIView):
    def get(self, request):
        user = get_user_from_request(request)
        if not user:
            return Response({"message": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)

        bills = Bill.objects.filter(user_id=user.id).order_by('-bill_no')
        final_data = []

        for b in bills:
            # Query bill items
            items_qs = BillItem.objects.filter(user_id=user.id, bill_no=b.bill_no)
            items = []
            total_sum = 0

            for row in items_qs:
                items.append({
                    "code": row.code,
                    "Name": row.name,
                    "Price": row.price,
                    "Qty": row.qty,
                    "Total": row.total
                })
                total_sum += row.total

            final_data.append({
                "bill_no": b.bill_no,
                "date": b.date.strftime("%Y-%m-%d %H:%M") if b.date else "",
                "total": total_sum,
                "items": items
            })

        return Response(final_data)

class BatchStockIncrementView(APIView):
    def post(self, request):
        user = get_user_from_request(request)
        if not user:
            return Response({"message": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)

        products = request.data.get("products", [])
        if not products:
            return Response({"status": "error", "message": "No products"}, status=status.HTTP_400_BAD_REQUEST)

        updated_count = 0
        for p in products:
            code = p["code"]
            qty = int(p.get("quantity", 1))

            rows = Product.objects.filter(user_id=user.id, code=code, is_active=True).update(
                stock=dj_models.F('stock') + qty
            )
            if rows > 0:
                updated_count += 1

        return Response({
            "status": "success",
            "updated": updated_count,
            "total": len(products)
        })

class GetAllProductsView(APIView):
    def get(self, request):
        user = get_user_from_request(request)
        if not user:
            return Response({"message": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)

        products = Product.objects.filter(user_id=user.id, is_active=True).order_by('code')
        product_list = [{"code": p.code, "name": p.name, "price": p.price, "stock": p.stock} for p in products]

        return Response({
            "status": "success",
            "products": product_list
        })
