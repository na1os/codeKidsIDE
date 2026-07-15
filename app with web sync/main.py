import customtkinter as ctk
import tkinter as tk
from tkinter import messagebox, simpledialog
import subprocess
import os
import sys
import tempfile
import shutil
import json
import re
import threading
import http.server
import socketserver

LECTII = [
    {"id": "1", "titlu": "1. Hello World", "descriere": "Primul program", "cod": 'print("Hello, World!")', "teorie": "In Python, folosim functia print() pentru a afisa texte pe ecran. Textul pe care vrem să-l afișăm trebuie pus între ghilimele (\" \" sau ' ). Acest text se numește 'string' (șir de caractere).", "asteptat": "hello, world!", "xp": 20},
    {"id": "2", "titlu": "2. Variabile", "descriere": "Salvare date", "cod": 'name = "Alex"\nprint(name)', "teorie": "Variabilele sunt ca niște cutii în care salvăm date. Folosim semnul egal = pentru a pune o valoare în variabilă. Numele variabilei nu are voie să conțină spații.", "asteptat": "alex", "xp": 50},
    {"id": "3", "titlu": "3. Operatii Mate", "descriere": "Calcule", "cod": 'print(5 + 3)\nprint(10 * 4)', "teorie": "Python poate fi folosit ca un calculator avansat. Poate aduna (+), scadea (-), inmulți (*) și împărți (/). Atenție: Numerele NU se pun între ghilimele.", "asteptat": "8\n40", "xp": 50},
    {"id": "4", "titlu": "4. If/Else", "descriere": "Decizii", "cod": 'varsta = 12\nif varsta > 10:\n    print("Mare")\nelse:\n    print("Mic")', "teorie": "Programele pot lua decizii. Folosim if (dacă) și else (altfel). Foarte important: Codul de sub 'if' trebuie mutat cu 4 spații (indentare)!", "asteptat": "mare", "xp": 100},
    {"id": "5", "titlu": "5. Bucle For", "descriere": "Repeta actiuni", "cod": 'for i in range(5):\n    print(i)', "teorie": "Buclele for repeta un bloc de cod de un anumit numar de ori. Folosim funcția range() pentru a spune de câte ori vrem să se repete.", "asteptat": "0\n1\n2\n3\n4", "xp": 100}
]

class GestionarSincronizare(http.server.BaseHTTPRequestHandler):
    instanta_aplicatie = None
    def log_message(self, format, *args): pass

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        if self.path == '/sync':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            date = json.dumps({"files": GestionarSincronizare.instanta_aplicatie.sistem_fisiere, "progress": GestionarSincronizare.instanta_aplicatie.progres})
            self.wfile.write(date.encode('utf-8'))

    def do_POST(self):
        if self.path == '/sync':
            lungime_continut = int(self.headers['Content-Length'])
            date_post = self.rfile.read(lungime_continut)
            try:
                date = json.loads(date_post.decode('utf-8'))
                GestionarSincronizare.instanta_aplicatie.sistem_fisiere = date['files']
                GestionarSincronizare.instanta_aplicatie.progres = date['progress']
                GestionarSincronizare.instanta_aplicatie.after(0, GestionarSincronizare.instanta_aplicatie.actualizare_interfata_din_web)
            except: pass
            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

class CodCopiiDesktop(ctk.CTk):
    def __init__(self):
        super().__init__()
        self.title("CodeKids Desktop - Pro IDE")
        self.geometry("1200x800")
        ctk.set_appearance_mode("dark")
        ctk.set_default_color_theme("dark-blue")
        
        self.CULOARE_FUNDAL = "#0a0a0f"
        self.CULOARE_PANOU = "#1e1e2e"
        self.CULOARE_CARD = "#282837"
        self.CULOARE_ACCENT = "#5eead4"
        self.CULOARE_TEXT = "#f8fafc"
        self.CULOARE_MUTED = "#94a3b8"
        self.CULOARE_EROARE = "#f87171"
        self.CULOARE_SUCCES = "#4ade80"
        
        self.configure(fg_color=self.CULOARE_FUNDAL)
        
        self.progres = {"xp": 0, "completed": []}
        self.sistem_fisiere = [{"path": "main.py", "code": 'print("Hello World")'}]
        self.fisier_activ = "main.py"
        self.lectie_activa = None
        self.se_actualizeaza = False

        GestionarSincronizare.instanta_aplicatie = self
        server_http = socketserver.TCPServer(("", 8000), GestionarSincronizare)
        threading.Thread(target=server_http.serve_forever, daemon=True).start()

        self.configurare_interfata()

    def configurare_interfata(self):
        bara_sus = ctk.CTkFrame(self, fg_color=self.CULOARE_PANOU, height=60, corner_radius=0)
        bara_sus.pack(fill=tk.X, side=tk.TOP)
        bara_sus.pack_propagate(False)
        
        ctk.CTkLabel(bara_sus, text="Code", text_color=self.CULOARE_TEXT, font=("Segoe UI", 20, "bold")).pack(side=tk.LEFT, padx=20)
        ctk.CTkLabel(bara_sus, text="Kids", text_color=self.CULOARE_ACCENT, font=("Segoe UI", 20, "bold")).pack(side=tk.LEFT)
        
        cadru_xp = ctk.CTkFrame(bara_sus, fg_color=self.CULOARE_PANOU)
        cadru_xp.pack(side=tk.LEFT, padx=40, fill=tk.X, expand=True)
        self.eticheta_nivel = ctk.CTkLabel(cadru_xp, text="Nivel 1", text_color="#c084fc", font=("Segoe UI", 12, "bold"), width=60)
        self.eticheta_nivel.pack(side=tk.LEFT)
        self.bara_xp = ctk.CTkProgressBar(cadru_xp, progress_color=self.CULOARE_ACCENT, fg_color=self.CULOARE_CARD, height=10, corner_radius=5)
        self.bara_xp.pack(side=tk.LEFT, padx=15, fill=tk.X, expand=True)
        self.bara_xp.set(0)
        self.eticheta_xp = ctk.CTkLabel(cadru_xp, text="0 XP", text_color=self.CULOARE_MUTED, font=("Segoe UI", 12), width=60)
        self.eticheta_xp.pack(side=tk.LEFT)

        panou_principal = tk.PanedWindow(self, bg=self.CULOARE_FUNDAL, sashwidth=6, sashrelief=tk.FLAT)
        panou_principal.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        bara_laterala = ctk.CTkFrame(panou_principal, fg_color=self.CULOARE_FUNDAL, corner_radius=12, width=320)
        panou_principal.add(bara_laterala, minsize=320, width=320)
        bara_laterala.grid_rowconfigure(1, weight=1)
        bara_laterala.grid_columnconfigure(0, weight=1)
        
        self.vizualizare_taburi = ctk.CTkTabview(bara_laterala, fg_color=self.CULOARE_PANOU, segmented_button_fg_color=self.CULOARE_FUNDAL, segmented_button_selected_color=self.CULOARE_ACCENT, segmented_button_selected_hover_color=self.CULOARE_ACCENT, corner_radius=10)
        self.vizualizare_taburi.grid(row=1, column=0, sticky="nsew", padx=5, pady=5)
        tab_fisiere = self.vizualizare_taburi.add("Explorator")
        tab_lectii = self.vizualizare_taburi.add("Lecții")

        cadru_butoane = ctk.CTkFrame(tab_fisiere, fg_color=self.CULOARE_PANOU)
        cadru_butoane.pack(fill=tk.X, pady=(0, 10))
        ctk.CTkButton(cadru_butoane, text="+ Fișier", command=self.creare_fisier, fg_color=self.CULOARE_CARD, hover_color="#383850", text_color=self.CULOARE_TEXT, width=70, corner_radius=6).pack(side=tk.LEFT, padx=3, expand=True, fill=tk.X)
        ctk.CTkButton(cadru_butoane, text="+ Folder", command=self.creare_director, fg_color=self.CULOARE_CARD, hover_color="#383850", text_color=self.CULOARE_TEXT, width=70, corner_radius=6).pack(side=tk.LEFT, padx=3, expand=True, fill=tk.X)
        
        self.defilare_fisiere = ctk.CTkScrollableFrame(tab_fisiere, fg_color=self.CULOARE_PANOU, corner_radius=0, scrollbar_button_color=self.CULOARE_CARD, scrollbar_button_hover_color=self.CULOARE_ACCENT)
        self.defilare_fisiere.pack(fill=tk.BOTH, expand=True)

        self.defilare_lectii = ctk.CTkScrollableFrame(tab_lectii, fg_color=self.CULOARE_PANOU, corner_radius=0, scrollbar_button_color=self.CULOARE_CARD, scrollbar_button_hover_color=self.CULOARE_ACCENT)
        self.defilare_lectii.pack(fill=tk.BOTH, expand=True)
        for l in LECTII:
            btn = ctk.CTkButton(self.defilare_lectii, text=l["titlu"], fg_color=self.CULOARE_CARD, hover_color="#383850", text_color=self.CULOARE_TEXT, anchor="w", font=("Segoe UI", 12, "bold"), corner_radius=6, command=lambda les=l: self.incarcare_lectie(les))
            btn.pack(fill=tk.X, pady=3)

        spatiu_lucru = ctk.CTkFrame(panou_principal, fg_color=self.CULOARE_FUNDAL, corner_radius=12)
        panou_principal.add(spatiu_lucru, minsize=600)
        spatiu_lucru.grid_rowconfigure(1, weight=2)
        spatiu_lucru.grid_rowconfigure(4, weight=1)
        spatiu_lucru.grid_columnconfigure(0, weight=1)
        
        antet_editor = ctk.CTkFrame(spatiu_lucru, fg_color=self.CULOARE_FUNDAL)
        antet_editor.grid(row=0, column=0, sticky="ew", pady=(0, 5))
        self.eticheta_tab_fisier = ctk.CTkLabel(antet_editor, text="main.py", text_color=self.CULOARE_ACCENT, font=("Consolas", 12, "bold"), anchor="w")
        self.eticheta_tab_fisier.pack(side=tk.LEFT, padx=15)
        
        self.editor = ctk.CTkTextbox(spatiu_lucru, fg_color=self.CULOARE_PANOU, text_color=self.CULOARE_TEXT, font=("Consolas", 14), wrap="none", corner_radius=10, border_width=0)
        self.editor.grid(row=1, column=0, sticky="nsew", padx=5)
        self.editor.insert("1.0", self.sistem_fisiere[0]["code"])
        self.editor.bind("<KeyRelease>", self.la_modificare_editor)

        cadru_butoane_editor = ctk.CTkFrame(spatiu_lucru, fg_color=self.CULOARE_FUNDAL)
        cadru_butoane_editor.grid(row=2, column=0, sticky="ew", pady=15)
        ctk.CTkButton(cadru_butoane_editor, text="▶  Rulare", command=self.rulare_cod, fg_color=self.CULOARE_ACCENT, text_color="black", font=("Segoe UI", 12, "bold"), width=90, corner_radius=8).pack(side=tk.LEFT, padx=5)
        ctk.CTkButton(cadru_butoane_editor, text="Trimite", command=self.trimitere_cod, fg_color=self.CULOARE_SUCCES, text_color="black", font=("Segoe UI", 12, "bold"), width=90, corner_radius=8).pack(side=tk.LEFT, padx=5)
        ctk.CTkButton(cadru_butoane_editor, text="Resetează", command=self.resetare_cod, fg_color=self.CULOARE_CARD, hover_color="#383850", text_color=self.CULOARE_TEXT, width=90, corner_radius=8).pack(side=tk.LEFT, padx=5)

        ctk.CTkLabel(spatiu_lucru, text="Consola Output", text_color=self.CULOARE_MUTED, font=("Segoe UI", 12, "bold"), anchor="w").grid(row=3, column=0, sticky="w", pady=(10, 5), padx=5)
        self.consola = ctk.CTkTextbox(spatiu_lucru, fg_color="#0f111a", text_color=self.CULOARE_TEXT, font=("Consolas", 12), height=200, corner_radius=10, border_width=0)
        self.consola.grid(row=4, column=0, sticky="nsew", padx=5)
        self.consola.tag_config("succes", foreground=self.CULOARE_SUCCES)
        self.consola.tag_config("eroare", foreground=self.CULOARE_EROARE)
        self.consola.tag_config("info", foreground=self.CULOARE_ACCENT)
        
        self.afisare_fisiere()

    def actualizare_interfata_din_web(self):
        self.se_actualizeaza = True
        self.afisare_fisiere()
        cod_curent = self.editor.get("1.0", tk.END).rstrip('\n')
        f = next((x for x in self.sistem_fisiere if x["path"] == self.fisier_activ), None)
        if f and f['code'] != cod_curent:
            self.editor.delete("1.0", tk.END)
            self.editor.insert("1.0", f['code'])
        self.actualizare_xp()
        self.se_actualizeaza = False

    def la_modificare_editor(self, event):
        if self.se_actualizeaza: return
        self.salvare_silentioasa_fisier_curent()

    def afisare_fisiere(self):
        for w in self.defilare_fisiere.winfo_children(): w.destroy()
        fisiere_sortate = sorted(self.sistem_fisiere, key=lambda x: x['path'])
        for f in fisiere_sortate:
            parti = f['path'].split('/')
            if parti[-1] == '__init__.py':
                nume_director = parti[-2] if len(parti) > 1 else parti[-1]
                btn = ctk.CTkButton(self.defilare_fisiere, text=f"📁 {nume_director}", fg_color=self.CULOARE_PANOU, hover_color=self.CULOARE_CARD, text_color="#c084fc", anchor="w", font=("Consolas", 12, "bold"), corner_radius=6)
                btn.pack(fill=tk.X, pady=2)
            else:
                este_activ = f['path'] == self.fisier_activ
                btn = ctk.CTkButton(self.defilare_fisiere, text=f"🐍 {parti[-1]}", fg_color=self.CULOARE_PANOU if not este_activ else "#2a3a3a", hover_color=self.CULOARE_CARD, text_color=self.CULOARE_TEXT, anchor="w", font=("Consolas", 12), corner_radius=6, border_color=self.CULOARE_ACCENT if este_activ else self.CULOARE_PANOU, border_width=1 if este_activ else 0)
                btn.pack(fill=tk.X, pady=2)
                btn.configure(command=lambda p=f['path']: self.incarcare_fisier(p))
                btn.bind("<Button-3>", lambda e, p=f['path']: self.afisare_meniu_contextual(e, p))

    def incarcare_fisier(self, cale):
        self.fisier_activ = cale
        f = next((x for x in self.sistem_fisiere if x["path"] == cale), None)
        if f:
            self.salvare_silentioasa_fisier_curent()
            self.editor.delete("1.0", tk.END)
            self.editor.insert("1.0", f["code"])
            self.eticheta_tab_fisier.configure(text=cale)
            self.afisare_fisiere()

    def creare_fisier(self):
        nume = simpledialog.askstring("Fișier Nou", "Nume (ex: test.py):")
        if nume:
            if not nume.endswith('.py'): nume += '.py'
            if not any(f['path'] == nume for f in self.sistem_fisiere):
                self.sistem_fisiere.append({"path": nume, "code": ""})
                self.incarcare_fisier(nume)

    def creare_director(self):
        nume = simpledialog.askstring("Folder Nou", "Nume folder:")
        if nume:
            cale_init = nume + "/__init__.py"
            if not any(f['path'] == cale_init for f in self.sistem_fisiere):
                self.sistem_fisiere.append({"path": cale_init, "code": ""})
                self.afisare_fisiere()

    def afisare_meniu_contextual(self, eveniment, cale):
        meniu = tk.Menu(self, tearoff=0, bg=self.CULOARE_PANOU, fg=self.CULOARE_TEXT, bd=0, activebackground=self.CULOARE_ACCENT, activeforeground="black")
        meniu.add_command(label="Redenumește", command=lambda: self.redenumire_fisier(cale))
        meniu.add_command(label="Șterge", command=lambda: self.stergere_fisier(cale))
        try: meniu.tk_popup(eveniment.x_root, eveniment.y_root)
        finally: meniu.grab_release()

    def redenumire_fisier(self, cale):
        nume_nou = simpledialog.askstring("Redenumire", "Noul nume:", initialvalue=cale.split('/')[-1])
        if nume_nou:
            if not nume_nou.endswith('.py'): nume_nou += '.py'
            parinte = "/".join(cale.split('/')[:-1])
            cale_noua = f"{parinte}/{nume_nou}" if parinte else nume_nou
            for f in self.sistem_fisiere:
                if f['path'] == cale:
                    f['path'] = cale_noua
                    if self.fisier_activ == cale: self.fisier_activ = cale_noua
                    break
            self.afisare_fisiere()

    def stergere_fisier(self, cale):
        if cale == "main.py": return
        self.sistem_fisiere = [f for f in self.sistem_fisiere if not f['path'].startswith(cale)]
        if self.fisier_activ == cale or self.fisier_activ.startswith(cale + "/"): self.incarcare_fisier("main.py")
        self.afisare_fisiere()

    def salvare_silentioasa_fisier_curent(self):
        cod = self.editor.get("1.0", tk.END).rstrip('\n')
        for f in self.sistem_fisiere:
            if f["path"] == self.fisier_activ: f["code"] = cod; break

    def incarcare_lectie(self, lectie):
        self.lectie_activa = lectie
        self.editor.delete("1.0", tk.END)
        self.editor.insert("1.0", lectie["cod"])
        messagebox.showinfo("Teorie - " + lectie["titlu"], lectie["teorie"])

    def analiza_eroare(self, stderr):
        potrivire = re.search(r'detected at line (\d+)|line (\d+), in <module>|File "<exec>", line (\d+)', stderr)
        nr_linie = next((g for g in potrivire.groups() if g), "necunoscută") if potrivire else "necunoscută"
        
        potrivire_tip = re.search(r'([a-zA-Z]+Error|Exception):\s*(.*)', stderr)
        if not potrivire_tip: return stderr
        
        tip_eroare = potrivire_tip.group(1)
        detalii_eroare = potrivire_tip.group(2)
        
        msg = f"[EROARE] {tip_eroare}\nLinia: {nr_linie}\nDetalii: {detalii_eroare}\n"
        if "unterminated string literal" in detalii_eroare or "EOL while scanning" in detalii_eroare:
            msg += "[SFAT] Ai uitat să închizi ghilimelele. Ex: print(\"hello\")"
        elif "never closed" in detalii_eroare:
            msg += "[SFAT] Ai uitat să închizi o paranteză."
        elif "expected ':'" in detalii_eroare:
            msg += "[SFAT] Ai uitat ':' la final."
        elif "unindent does not match" in detalii_eroare:
            msg += "[SFAT] Ai amestecat spații cu tab-uri."
        return msg

    def rulare_cod(self):
        self.salvare_silentioasa_fisier_curent()
        cod = self.editor.get("1.0", tk.END)
        self.consola.delete("1.0", tk.END)
        
        director_sandbox = tempfile.mkdtemp(prefix="codekids_sandbox_")
        cale_temporara = os.path.join(director_sandbox, "main.py")
        with open(cale_temporara, "w", encoding="utf-8") as f:
            f.write(cod)
            
        for fisier in self.sistem_fisiere:
            if fisier['path'] != "main.py":
                cale_f = os.path.join(director_sandbox, fisier['path'])
                os.makedirs(os.path.dirname(cale_f), exist_ok=True)
                with open(cale_f, "w", encoding="utf-8") as f:
                    f.write(fisier['code'])
        
        try:
            rezultat = subprocess.run([sys.executable, cale_temporara], capture_output=True, text=True, timeout=5, cwd=director_sandbox)
            
            if "ModuleNotFoundError" in rezultat.stderr:
                modul_lipsa = re.search(r"No module named '([^']+)'", rezultat.stderr)
                if modul_lipsa:
                    nume_modul = modul_lipsa.group(1)
                    self.consola.insert(tk.END, f"Modulul '{nume_modul}' lipsește. Instalez automat (pip install)...\n", "info")
                    self.update()
                    
                    proces_instalare = subprocess.run([sys.executable, "-m", "pip", "install", nume_modul], capture_output=True, text=True)
                    if proces_instalare.returncode == 0:
                        self.consola.insert(tk.END, "Instalare reușită! Re-rulez codul...\n\n", "info")
                        self.update()
                        rezultat = subprocess.run([sys.executable, cale_temporara], capture_output=True, text=True, timeout=5, cwd=director_sandbox)
                    else:
                        self.consola.insert(tk.END, f"Eroare la instalarea modulului '{nume_modul}'.\n", "eroare")
                        return
            
            if rezultat.stdout: self.consola.insert(tk.END, rezultat.stdout + "\n", "succes")
            if rezultat.stderr: self.consola.insert(tk.END, self.analiza_eroare(rezultat.stderr) + "\n", "eroare")
                
        except subprocess.TimeoutExpired:
            self.consola.insert(tk.END, "Eroare: Codul a durat prea mult (poate e o buclă infinită).\n", "eroare")
        except Exception as e:
            self.consola.insert(tk.END, f"Eroare de sistem: {e}\n", "eroare")
        finally:
            shutil.rmtree(director_sandbox, ignore_errors=True)

    def trimitere_cod(self):
        self.rulare_cod()
        iesire = self.consola.get("1.0", tk.END).strip().lower()
        if not self.lectie_activa: messagebox.showwarning("Atenție", "Selectează o lecție!"); return
        if self.lectie_activa["asteptat"] in iesire:
            if self.lectie_activa["id"] not in self.progres["completed"]:
                self.progres["completed"].append(self.lectie_activa["id"])
                self.progres["xp"] += self.lectie_activa["xp"]
                self.actualizare_xp()
                messagebox.showinfo("Succes", f"Lecție completată! +{self.lectie_activa['xp']} XP")
            else: messagebox.showinfo("Succes", "Corect!")
        else: messagebox.showwarning("Greșit", "Rezultat incorect.")

    def actualizare_xp(self):
        xp = self.progres.get("xp", 0)
        nivel = xp // 100 + 1
        procent = (xp % 100) / 100
        self.bara_xp.set(procent)
        self.eticheta_nivel.configure(text=f"Nivel {nivel}")
        self.eticheta_xp.configure(text=f"{xp} XP")

    def resetare_cod(self):
        if self.lectie_activa:
            self.editor.delete("1.0", tk.END)
            self.editor.insert("1.0", self.lectie_activa["cod"])

if __name__ == "__main__":
    aplicatie = CodCopiiDesktop()
    aplicatie.mainloop()