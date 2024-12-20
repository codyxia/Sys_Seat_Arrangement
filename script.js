let students = [];

// 处理文件上传
document.getElementById('fileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {type: 'array'});
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        // 处理数据，确保包含必要的字段
        students = jsonData.map(row => ({
            name: row['姓名'] || row.name || '',
            height: parseFloat(row['身高'] || row.height || 0),
            grade: parseFloat(row['成绩'] || row.grade || 0)
        }));

        // 自动生成座位表
        arrangeSeatsByRules();
    };

    reader.readAsArrayBuffer(file);
});

// 根据规则排序学生
function sortStudents() {
    return students.sort((a, b) => {
        if (a.height === b.height) {
            return b.grade - a.grade; // 身高相同时，成绩高的靠前
        }
        if (a.grade === b.grade) {
            return a.height - b.height; // 成绩相同时，身高矮的靠前
        }
        return b.height - a.height; // 默认按身高降序
    });
}

// 生成座位表
function arrangeSeatsByRules() {
    const seatingChart = document.getElementById('seatingChart');
    seatingChart.innerHTML = ''; // 清空现有座位
    
    const seatsPerRow = parseInt(document.getElementById('seatsPerRow').value) || 6;
    const sortedStudents = sortStudents();
    
    // 计算需要多少排
    const rows = Math.ceil(sortedStudents.length / seatsPerRow);
    
    // 创建每一排
    for (let i = 0; i < rows; i++) {
        const row = document.createElement('div');
        row.className = 'row';
        
        // 创建这一排的座位
        for (let j = 0; j < seatsPerRow; j++) {
            const studentIndex = i * seatsPerRow + j;
            if (studentIndex < sortedStudents.length) {
                const seat = document.createElement('div');
                seat.className = 'seat';
                seat.textContent = sortedStudents[studentIndex].name;
                seat.setAttribute('data-student', JSON.stringify(sortedStudents[studentIndex]));
                row.appendChild(seat);
            }
        }
        
        seatingChart.appendChild(row);
        
        // 为每一排添加拖拽功能
        new Sortable(row, {
            group: 'seats',
            animation: 150,
            onEnd: function(evt) {
                // 更新学生数据数组
                const rows = document.querySelectorAll('.row');
                students = [];
                rows.forEach(row => {
                    const seats = row.querySelectorAll('.seat');
                    seats.forEach(seat => {
                        const studentData = JSON.parse(seat.getAttribute('data-student'));
                        students.push(studentData);
                    });
                });
            }
        });
    }
}

// 下载座位图
function downloadSeatingChart() {
    html2canvas(document.getElementById('seatingChart')).then(canvas => {
        const link = document.createElement('a');
        link.download = '座位表.png';
        link.href = canvas.toDataURL();
        link.click();
    });
}
