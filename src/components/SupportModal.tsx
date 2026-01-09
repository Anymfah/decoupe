import { Info, Box, Scissors, Maximize, RefreshCw, Layers, LayoutGrid } from 'lucide-react';
import { Modal } from './ui';

export function SupportModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Aide & Support">
      <div className="space-y-8">
        <section>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-accent/10 rounded-lg text-accent">
              <Info className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-bold">À propos de EzCut</h4>
          </div>
          <p className="text-muted leading-relaxed">
            EzCut est un outil d'optimisation de découpe de panneaux 2D. Il vous aide à organiser vos pièces de manière à minimiser la perte de matière première, que vous travailliez le bois, le métal, le verre ou tout autre matériau en plaques.
          </p>
        </section>

        <section>
          <h4 className="text-sm font-bold uppercase tracking-widest text-accent mb-4">Lexique & Dénominations</h4>
          <div className="grid gap-4">
            <div className="p-4 rounded-xl bg-black/5 dark:bg-white/[0.03] border border-black/5 dark:border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <Box className="w-4 h-4 text-accent" />
                <span className="font-bold text-sm">Planche de base</span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Le format standard de vos panneaux bruts. C'est la source principale de matière que l'algorithme utilisera si vos chutes ne suffisent pas.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-black/5 dark:bg-white/[0.03] border border-black/5 dark:border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <Layers className="w-4 h-4 text-accent" />
                <span className="font-bold text-sm">Chutes & Stock</span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Vos restes de projets précédents. L'outil les utilisera en priorité pour placer vos pièces avant d'entamer une nouvelle planche de base.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-black/5 dark:bg-white/[0.03] border border-black/5 dark:border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <Scissors className="w-4 h-4 text-accent" />
                <span className="font-bold text-sm">Kerf (Lame)</span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                L'épaisseur du trait de coupe (l'épaisseur de votre lame de scie). Cette valeur est ajoutée entre chaque pièce pour garantir que les dimensions finales soient respectées après la coupe.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-black/5 dark:bg-white/[0.03] border border-black/5 dark:border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <LayoutGrid className="w-4 h-4 text-accent" />
                <span className="font-bold text-sm">Marge</span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Zone de sécurité sur tout le pourtour de la planche où aucune pièce ne sera placée (utile pour éviter les bords abîmés ou pour les brides de maintien).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-black/5 dark:bg-white/[0.03] border border-black/5 dark:border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <RefreshCw className="w-4 h-4 text-accent" />
                <span className="font-bold text-sm">Rotation & EFF</span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                <strong className="text-text">EFF Autorisée :</strong> Indique si la rotation est réellement active pour cette pièce (dépend du réglage de la pièce et du réglage global).<br/>
                <strong className="text-text">Rotation :</strong> La pièce a été pivotée de 90° par l'algorithme pour mieux tenir sur la planche.<br/>
                <strong className="text-text">Standard / Normal :</strong> La pièce est placée dans son orientation d'origine (Largeur × Hauteur).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-black/5 dark:bg-white/[0.03] border border-black/5 dark:border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <Maximize className="w-4 h-4 text-accent" />
                <span className="font-bold text-sm">Efficacité</span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Représente le pourcentage de surface réellement utilisée par vos pièces par rapport à la surface totale consommée. Plus ce chiffre est haut, moins vous avez de déchets.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-accent/5 p-5 rounded-apple-2xl border border-accent/10">
          <h4 className="text-sm font-bold mb-3">Besoin d'aide supplémentaire ?</h4>
          <p className="text-xs text-muted mb-4 leading-relaxed">
            Pour tout problème technique ou suggestion, vous pouvez contacter le support à l'adresse dédiée ou consulter la documentation complète sur notre dépôt GitHub.
          </p>
          <div className="flex flex-wrap gap-3">
            <a 
              href="mailto:anym@hotmail.fr" 
              className="text-[11px] font-bold bg-accent text-white px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-all active:scale-95"
            >
              Envoyer un email
            </a>
            <a 
              href="https://github.com/Anymfah" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[11px] font-bold bg-black/5 dark:bg-white/5 text-text px-4 py-2 rounded-full shadow-sm hover:bg-black/10 dark:hover:bg-white/10 transition-all active:scale-95 border border-black/5 dark:border-white/5"
            >
              GitHub
            </a>
            <a 
              href="https://www.linkedin.com/in/ss-jamii/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[11px] font-bold bg-[#0077B5] text-white px-4 py-2 rounded-full shadow-sm hover:opacity-90 transition-all active:scale-95"
            >
              LinkedIn
            </a>
          </div>
        </section>

        <div className="pt-4 border-t border-black/5 dark:border-white/5 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted">
            Développé avec passion par <span className="text-accent">Soheil Saheb-Jamii</span>
          </p>
        </div>
      </div>
    </Modal>
  );
}
