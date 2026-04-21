<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

final class SeoController extends AbstractController
{
    #[Route('/sitemap.xml', name: 'app_sitemap', methods: ['GET'])]
    public function sitemap(Request $request): Response
    {
        $baseUrl = $request->getSchemeAndHttpHost();
        $now = (new \DateTimeImmutable())->format('c');
        $urls = [
            $baseUrl . $this->generateUrl('task_index'),
        ];

        $xml = ['<?xml version="1.0" encoding="UTF-8"?>'];
        $xml[] = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

        foreach ($urls as $url) {
            $xml[] = '  <url>';
            $xml[] = '    <loc>' . htmlspecialchars($url, ENT_XML1) . '</loc>';
            $xml[] = '    <lastmod>' . $now . '</lastmod>';
            $xml[] = '    <changefreq>daily</changefreq>';
            $xml[] = '    <priority>0.8</priority>';
            $xml[] = '  </url>';
        }

        $xml[] = '</urlset>';

        $response = new Response(implode("\n", $xml));
        $response->headers->set('Content-Type', 'application/xml; charset=UTF-8');
        $response->setPublic();
        $response->setMaxAge(3600);
        $response->setSharedMaxAge(86400);

        return $response;
    }
}
