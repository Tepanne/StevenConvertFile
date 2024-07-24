// Fungsi untuk membaca dan menampilkan isi file teks ke textarea
document.getElementById('txtFileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            document.getElementById('fileContent').value = content;
        };
        reader.readAsText(file);
    }
});

// Fungsi untuk menghitung kontak dalam textarea
function countContacts(text) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    return lines.length;
}

// Fungsi untuk menghitung kontak di menu konversi
document.getElementById('convertCountButton').addEventListener('click', function() {
    const text = document.getElementById('fileContent').value.trim();

    if (!text) {
        alert('Isi textarea tidak boleh kosong!');
        return;
    }

    const contactCount = countContacts(text);
    document.getElementById('convertContactCount').value = `Jumlah kontak: ${contactCount}`;
});

// Fungsi untuk mengkonversi file teks ke VCF
document.getElementById('convertButton').addEventListener('click', function() {
    const text = document.getElementById('fileContent').value.trim();
    const fileName = document.getElementById('convertFileNameInput').value.trim() || 'output';
    const contactName = document.getElementById('contactNameInput').value.trim() || 'contact';

    if (!text) {
        alert('Isi textarea tidak boleh kosong!');
        return;
    }

    function ensurePlusSign(number) {
        return number.startsWith('+') ? number : `+${number}`;
    }

    const lines = text.split('\n').map(line => ensurePlusSign(line.trim()));
    const contactCount = lines.length;

    const vcfContent = lines.map((line, index) => 
`BEGIN:VCARD
VERSION:3.0
FN:${contactName}_${index + 1}
TEL:${line}
END:VCARD`
    ).join('\n');

    const blob = new Blob([vcfContent], { type: 'text/vcf' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.vcf`;
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    document.getElementById('convertContactCount').value = `Jumlah kontak: ${contactCount}`;
});

// Fungsi untuk menghitung kontak di menu pecah file VCF
document.getElementById('splitButton').addEventListener('click', function() {
    const fileInput = document.getElementById('vcfFileInput');
    const file = fileInput.files[0];
    const contactsPerFile = parseInt(document.getElementById('contactsPerFile').value.trim(), 10);
    const fileName = document.getElementById('splitFileNameInput').value.trim() || 'output';

    if (!file) {
        alert('Harap pilih file VCF terlebih dahulu!');
        return;
    }

    if (isNaN(contactsPerFile) || contactsPerFile < 1) {
        alert('Jumlah kontak per file harus berupa angka positif!');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const vcfContent = e.target.result;
        const contacts = vcfContent.split('END:VCARD').filter(entry => entry.trim()).map(entry => entry + 'END:VCARD');

        if (contacts.length === 0) {
            alert('Tidak ada kontak yang ditemukan dalam file VCF!');
            return;
        }

        const chunks = [];
        for (let i = 0; i < contacts.length; i += contactsPerFile) {
            chunks.push(contacts.slice(i, i + contactsPerFile));
        }

        chunks.forEach((chunk, index) => {
            const vcfContent = chunk.join('\n');
            const blob = new Blob([vcfContent], { type: 'text/vcf' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `${fileName}_part${index + 1}.vcf`;
            document.body.appendChild(a);
            a.click();

            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });

        document.getElementById('splitContactCount').value = `Jumlah kontak: ${contacts.length}`;
    };

    reader.readAsText(file);
});

// Fungsi untuk menggabungkan semua file teks
document.getElementById('mergeButton').addEventListener('click', function() {
    const fileInput = document.getElementById('txtFilesInput');
    const files = fileInput.files;
    const mergedFileName = document.getElementById('mergedFileNameInput').value.trim() || 'merged_output';

    if (files.length === 0) {
        alert('Harap pilih file teks terlebih dahulu!');
        return;
    }

    const readerPromises = Array.from(files).map(file => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                resolve(e.target.result);
            };
            reader.onerror = function(e) {
                reject(e);
            };
            reader.readAsText(file);
        });
    });

    Promise.all(readerPromises)
        .then(contents => {
            const mergedContent = contents.join('\n');
            const blob = new Blob([mergedContent], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `${mergedFileName}.txt`;
            document.body.appendChild(a);
            a.click();

            URL.revokeObjectURL(url);
            document.body.removeChild(a);
        })
        .catch(error => {
            console.error('Error reading files:', error);
            alert('Gagal membaca file teks.');
        });
});

// Fungsi untuk mengkonversi file VCF ke TXT
document.getElementById('convertVcfToTxtButton').addEventListener('click', function() {
    const fileInput = document.getElementById('vcfToTxtFileInput');
    const file = fileInput.files[0];

    if (!file) {
        alert('Harap pilih file VCF terlebih dahulu!');
        return;
    }

    const reader = new FileReader();

    reader.onload = function(e) {
        const vcfContent = e.target.result;
        const contacts = vcfContent.split('END:VCARD').filter(entry => entry.trim()).map(entry => {
            const telMatch = entry.match(/TEL:(.+)/);
            return telMatch ? telMatch[1] : '';
        });
        
        const txtContent = contacts.join('\n');
        document.getElementById('txtFileContent').value = txtContent;

        const blob = new Blob([txtContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'output.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    reader.readAsText(file);
});
