<?php
header('Content-Type: application/json');
$file = __DIR__ . '/sync_data.json';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = file_get_contents('php://input');
    file_put_contents($file, $data);
    echo json_encode(["status" => "ok"]);
} else {
    if (file_exists($file)) {
        echo file_get_contents($file);
    } else {
        $default = ["files" => [["path" => "main.py", "code" => "print('Hello')"]], "progress" => ["xp" => 0, "completed" => []]];
        echo json_encode($default);
    }
}
?>