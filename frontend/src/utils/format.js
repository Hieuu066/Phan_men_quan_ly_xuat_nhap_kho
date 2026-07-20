// Định dạng số tiền theo chuẩn Việt Nam (dấu chấm ngăn cách hàng nghìn)
export function formatCurrency(value) {
  return Number(value || 0).toLocaleString('vi-VN') + 'đ';
}

export function formatNumber(value) {
  return Number(value || 0).toLocaleString('vi-VN');
}

export function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('vi-VN');
}
