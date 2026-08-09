from django.db import models

class User(models.Model):
    name = models.TextField(null=True, blank=True)
    mobile = models.TextField(null=True, blank=True)
    password = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'users'

class Product(models.Model):
    user_id = models.IntegerField(null=True, blank=True)
    code = models.TextField(null=True, blank=True)
    name = models.TextField(null=True, blank=True)
    price = models.IntegerField(null=True, blank=True)
    stock = models.IntegerField(null=True, blank=True)
    is_active = models.BooleanField(default=True, null=True, blank=True)

    class Meta:
        db_table = 'products'

class Bill(models.Model):
    user_id = models.IntegerField(null=True, blank=True)
    bill_no = models.IntegerField(null=True, blank=True)
    date = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'bills'

class BillItem(models.Model):
    user_id = models.IntegerField(null=True, blank=True)
    bill_no = models.IntegerField(null=True, blank=True)
    code = models.TextField(null=True, blank=True)
    name = models.TextField(null=True, blank=True)
    price = models.IntegerField(null=True, blank=True)
    qty = models.IntegerField(null=True, blank=True)
    total = models.IntegerField(null=True, blank=True)
    datetime = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'bill_items'
