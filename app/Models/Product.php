<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = ['sku', 'name', 'category', 'unit', 'reorder_level'];

    public function inventories()
    {
        return $this->hasMany(Inventory::class);
    }

    public function goodsReceipts()
    {
        return $this->hasMany(GoodsReceipt::class);
    }

    public function goodsIssues()
    {
        return $this->hasMany(GoodsIssue::class);
    }
}
