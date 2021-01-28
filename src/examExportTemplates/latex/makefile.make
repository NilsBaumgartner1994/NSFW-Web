PICS = pics
SVGS = $(wildcard $(PICS)/*.svg)
EPSS = $(patsubst %.svg,%.eps,$(wildcard $(PICS)/*.svg))

$(PICS)/%.eps : $(PICS)/%.svg
	convert $< $@

all: apdf solpdf mult

a: $(EPSS)
	pdlatex exam.tex
	pdlatex exam.tex
	# We need to run the command twice to use the Lastpage command \pageref{LastPage}, counting amount of pages

apdf: $(EPSS)
	pdflatex exam.tex
	pdflatex exam.tex
	# We need to run the command twice to use the Lastpage command \pageref{LastPage}, counting amount of pages

sol: $(EPSS)
	pdflatex solution.tex
	pdflatex solution.tex
	# We need to run the command twice to use the Lastpage command \pageref{LastPage}, counting amount of pages
    
solpdf: $(EPSS)
	pdflatex solution.tex
	pdflatex solution.tex
	# We need to run the command twice to use the Lastpage command \pageref{LastPage}, counting amount of pages

mult: $(EPSS)
	pdflatex mult.tex
	pdflatex mult.tex
    # We need to run the command twice to use the Lastpage command \pageref{LastPage}, counting amount of pages
	rm -f *.cpt mult.log mult.toc mult.aux mult.dvi

clean:
	rm -f *.dvi *.log *.toc *.aux __exam_tmp.* *.cpt

zip:
	zip -e ../../1.klausur.zip exam.pdf solution.pdf mult.pdf