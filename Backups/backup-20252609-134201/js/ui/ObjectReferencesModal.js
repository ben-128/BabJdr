// Test minimal
console.log('ObjectReferencesModal: TEST SIMPLE');
alert('MODAL TEST - ça marche !');

window.ObjectReferencesModal = {
  show: function(objectNumero) {
    alert(`Références pour objet ${objectNumero}`);
  }
};

console.log('ObjectReferencesModal: créé', typeof window.ObjectReferencesModal);